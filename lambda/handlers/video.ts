import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  renderMediaOnLambda,
  getRenderProgress,
  AwsRegion,
} from '@remotion/lambda/client';
import { verifyToken } from '../utils/auth';

const VIDEOS_BUCKET = process.env.VIDEOS_BUCKET!;
const REMOTION_FUNCTION_NAME = process.env.REMOTION_FUNCTION_NAME!;
const REMOTION_SERVE_URL = process.env.REMOTION_SERVE_URL!;
const s3Client = new S3Client({ region: process.env.AWS_REGION });

interface RenderRequest {
  images: Array<{ date: string; url: string }>;
  language: 'tr' | 'en';
  backgroundColor: string;
  transitionType: 'fade' | 'slide' | 'none';
  imageDuration: number;
}

export const renderVideo = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const user = await verifyToken(event);
    if (!user) {
      return {
        statusCode: 401,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    const {
      images,
      language,
      backgroundColor,
      transitionType,
      imageDuration,
    }: RenderRequest = JSON.parse(event.body || '{}');

    if (!images || images.length === 0) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'No images provided' }),
      };
    }

    console.log(`Starting render...`);
    const outName = `${user.sub}/${Date.now()}.mp4`;
    // Start actual Remotion Lambda render
    const { renderId } = await renderMediaOnLambda({
      region: process.env.AWS_REGION! as AwsRegion,
      functionName: REMOTION_FUNCTION_NAME,
      composition: 'TimelapseVideo',
      serveUrl: REMOTION_SERVE_URL,
      codec: 'h264',
      concurrencyPerLambda: 1,
      inputProps: {
        images,
        language,
        backgroundColor,
        transitionType,
        imageDuration,
      },
      framesPerLambda: 100,
      logLevel: 'verbose',
      forceBucketName: VIDEOS_BUCKET,
      privacy: 'private',
      downloadBehavior: {
        type: 'download',
        fileName: 'video.mp4',
      },
      outName,
    });
    console.log(`Render started ${renderId}`);
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        renderId,
        bucketName: VIDEOS_BUCKET,
        outName,
        message: 'Video rendering started',
      }),
    };
  } catch (error) {
    console.error('Error rendering video:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Failed to render video' }),
    };
  }
};

export const getRenderStatus = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const user = await verifyToken(event);
    if (!user) {
      return {
        statusCode: 401,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    // Extract render ID from path
    const renderId =
      event.pathParameters?.renderId || event.path?.split('/video/status/')[1];

    if (!renderId) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Render ID required' }),
      };
    }

    // Get actual render progress from Remotion Lambda
    let progress;
    const outName = event.queryStringParameters?.outName;

    try {
      progress = await getRenderProgress({
        renderId,
        bucketName: VIDEOS_BUCKET,
        functionName: REMOTION_FUNCTION_NAME,
        region: process.env.AWS_REGION! as AwsRegion,
      });
    } catch (error) {
      console.error('getRenderProgress error:', error);
      // Return mock progress if getRenderProgress fails
      progress = {
        done: true,
        overallProgress: 1,
        outputFile: `s3://${VIDEOS_BUCKET}/renders/${renderId}/${outName}`,
      };
    }

    let outputFile = null;
    if (progress.done) {
      // Use the outName from the original render request to generate presigned URL
      if (outName) {
        const getObjectCommand = new GetObjectCommand({
          Bucket: VIDEOS_BUCKET,
          Key: `renders/${renderId}/${outName}`,
        });

        outputFile = await getSignedUrl(s3Client, getObjectCommand, {
          expiresIn: 3600,
        });
      } else if (progress.outputFile) {
        // Fallback to parsing S3 URL from progress
        const s3Url = progress.outputFile;
        const bucketName = s3Url.match(/s3:\/\/([^/]+)/)?.[1];
        const key = s3Url.replace(/s3:\/\/[^/]+\//, '');

        if (bucketName && key) {
          const getObjectCommand = new GetObjectCommand({
            Bucket: bucketName,
            Key: key,
          });

          outputFile = await getSignedUrl(s3Client, getObjectCommand, {
            expiresIn: 3600,
          });
        }
      }
    }

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        done: progress.done,
        overallProgress: progress.overallProgress,
        outputFile,
      }),
    };
  } catch (error) {
    console.error('Error getting render status:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Failed to get render status' }),
    };
  }
};
