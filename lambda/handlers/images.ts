import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import {
  CognitoIdentityProviderClient,
  GetUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ApiResponse } from '../types';

const s3Client = new S3Client({});
const cognitoClient = new CognitoIdentityProviderClient({});
const imagesBucket = process.env.IMAGES_BUCKET!;

const getUserEmail = async (authHeader?: string): Promise<string> => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return 'shared';
  }

  try {
    const token = authHeader.substring(7);
    const getUserResult = await cognitoClient.send(
      new GetUserCommand({ AccessToken: token })
    );
    const emailAttribute = getUserResult.UserAttributes?.find(
      (attr) => attr.Name === 'email'
    );
    return emailAttribute?.Value || 'shared';
  } catch {
    return 'shared';
  }
};

export const uploadImage = async (
  body: string,
  headers: Record<string, string>,
  authHeader?: string
): Promise<ApiResponse> => {
  console.log('Upload function started');
  try {
    console.log('Parsing request body');
    const parsedBody = JSON.parse(body || '{}');
    const { imageData } = parsedBody;
    
    if (!imageData) {
      console.error('No imageData provided');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'No image data provided' }),
      };
    }

    const userEmail = await getUserEmail(authHeader);
    console.log(`Uploading for user: ${userEmail}`);

    const today = new Date().toISOString().split('T')[0];
    const key = `daily-images/${userEmail}/${today}.jpg`;
    console.log(`S3 key: ${key}`);

    console.log('Converting base64 to buffer');
    const buffer = Buffer.from(imageData, 'base64');
    console.log(`Buffer size: ${buffer.length} bytes`);

    console.log('Uploading to S3');
    const uploadPromise = s3Client.send(
      new PutObjectCommand({
        Bucket: imagesBucket,
        Key: key,
        Body: buffer,
        ContentType: 'image/jpeg',
      })
    );
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('S3 upload timeout')), 25000)
    );
    
    await Promise.race([uploadPromise, timeoutPromise]);

    console.log(`Upload completed successfully for ${userEmail}`);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Image uploaded successfully',
        date: today,
      }),
    };
  } catch (error) {
    console.error('Upload error:', error);
    console.error('Error stack:', (error as Error).stack);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: 'Upload failed',
        error: (error as Error).message,
      }),
    };
  }
};

export const getImages = async (
  headers: Record<string, string>,
  authHeader?: string
): Promise<ApiResponse> => {
  try {
    const userEmail = await getUserEmail(authHeader);

    const listCommand = new ListObjectsV2Command({
      Bucket: imagesBucket,
      Prefix: `daily-images/${userEmail}/`,
    });

    const response = await s3Client.send(listCommand);
    const images = [];

    if (response.Contents) {
      for (const object of response.Contents) {
        if (object.Key && object.Key !== `daily-images/${userEmail}/`) {
          const date = object.Key.replace(
            `daily-images/${userEmail}/`,
            ''
          ).replace('.jpg', '');
          const getObjectCommand = new GetObjectCommand({
            Bucket: imagesBucket,
            Key: object.Key,
          });
          const url = await getSignedUrl(s3Client, getObjectCommand, {
            expiresIn: 3600,
          });
          images.push({ date, url });
        }
      }
    }

    images.sort((a, b) => b.date.localeCompare(a.date));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ images }),
    };
  } catch (error) {
    console.error('Error listing images:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to load images' }),
    };
  }
};