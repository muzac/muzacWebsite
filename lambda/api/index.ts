import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  SignUpCommand,
  ConfirmSignUpCommand,
  ResendConfirmationCodeCommand,
  GetUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({});
const cognitoClient = new CognitoIdentityProviderClient({});
const imagesBucket = process.env.IMAGES_BUCKET!;
const userPoolClientId = process.env.USER_POOL_CLIENT_ID!;

const checkOrigin = (referer: string): boolean => {
  const allowedDomains = [
    'https://muzac.com.tr',
    'https://www.muzac.com.tr',
    'http://localhost:3000',
  ];
  return allowedDomains.some((domain) => referer.startsWith(domain));
};

const login = async (
  body: string,
  headers: Record<string, string>
): Promise<APIGatewayProxyResult> => {
  try {
    const { email, password } = JSON.parse(body || '{}');

    const authResult = await cognitoClient.send(
      new InitiateAuthCommand({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: userPoolClientId,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
        },
      })
    );

    if (!authResult.AuthenticationResult?.AccessToken) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ message: 'Authentication failed' }),
      };
    }

    const token = authResult.AuthenticationResult.AccessToken;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        token,
        user: { email },
      }),
    };
  } catch (error: unknown) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        message: (error as Error).message || 'Login failed',
      }),
    };
  }
};

const register = async (
  body: string,
  headers: Record<string, string>
): Promise<APIGatewayProxyResult> => {
  try {
    const { email, password } = JSON.parse(body || '{}');

    try {
      await cognitoClient.send(
        new SignUpCommand({
          ClientId: userPoolClientId,
          Username: email,
          Password: password,
          UserAttributes: [{ Name: 'email', Value: email }],
        })
      );
    } catch (error: unknown) {
      if (
        (error as Error & { name?: string }).name === 'UsernameExistsException'
      ) {
        // User exists but might not be verified, resend code
        await cognitoClient.send(
          new ResendConfirmationCodeCommand({
            ClientId: userPoolClientId,
            Username: email,
          })
        );
      } else {
        throw error;
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Registration successful. Please check your email.',
      }),
    };
  } catch (error: unknown) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        message: (error as Error).message || 'Registration failed',
      }),
    };
  }
};

const confirmSignup = async (
  body: string,
  headers: Record<string, string>
): Promise<APIGatewayProxyResult> => {
  try {
    const { email, code } = JSON.parse(body || '{}');

    await cognitoClient.send(
      new ConfirmSignUpCommand({
        ClientId: userPoolClientId,
        Username: email,
        ConfirmationCode: code,
      })
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Email verified successfully. You can now login.',
      }),
    };
  } catch (error: unknown) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        message: (error as Error).message || 'Verification failed',
      }),
    };
  }
};

const resendCode = async (
  body: string,
  headers: Record<string, string>
): Promise<APIGatewayProxyResult> => {
  try {
    const { email } = JSON.parse(body || '{}');

    await cognitoClient.send(
      new ResendConfirmationCodeCommand({
        ClientId: userPoolClientId,
        Username: email,
      })
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Verification code resent. Please check your email.',
      }),
    };
  } catch (error: unknown) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        message: (error as Error).message || 'Failed to resend code',
      }),
    };
  }
};

const verifyToken = async (
  headers: Record<string, string>,
  authHeader?: string
): Promise<APIGatewayProxyResult> => {
  try {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ message: 'No token provided' }),
      };
    }

    const token = authHeader.substring(7);

    // Get user details from Cognito using the access token
    const getUserResult = await cognitoClient.send(
      new GetUserCommand({
        AccessToken: token,
      })
    );

    const emailAttribute = getUserResult.UserAttributes?.find(
      (attr) => attr.Name === 'email'
    );

    const email = emailAttribute?.Value || getUserResult.Username;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        user: { email, sub: getUserResult.Username },
      }),
    };
  } catch {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ message: 'Token verification failed' }),
    };
  }
};

const getCorsHeaders = (referer: string) => {
  let origin = 'https://muzac.com.tr';

  if (
    referer.startsWith('https://muzac.com.tr') ||
    referer.startsWith('https://www.muzac.com.tr')
  ) {
    origin = referer.split('/').slice(0, 3).join('/');
  } else if (referer.startsWith('http://localhost:3000')) {
    origin = 'http://localhost:3000';
  }

  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
};

const uploadImage = async (
  body: string,
  headers: Record<string, string>,
  authHeader?: string
): Promise<APIGatewayProxyResult> => {
  try {
    // Get user from token
    let userEmail = 'shared';
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const getUserResult = await cognitoClient.send(
        new GetUserCommand({ AccessToken: token })
      );
      const emailAttribute = getUserResult.UserAttributes?.find(
        (attr) => attr.Name === 'email'
      );
      userEmail = emailAttribute?.Value || 'shared';
    }

    const { imageData } = JSON.parse(body || '{}');
    const today = new Date().toISOString().split('T')[0];
    const key = `daily-images/${userEmail}/${today}.jpg`;

    const buffer = Buffer.from(imageData, 'base64');

    await s3Client.send(
      new PutObjectCommand({
        Bucket: imagesBucket,
        Key: key,
        Body: buffer,
        ContentType: 'image/jpeg',
      })
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Image uploaded successfully',
        date: today,
      }),
    };
  } catch (ex) {
    console.log(ex);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: 'Upload failed',
      }),
    };
  }
};

const getImages = async (
  headers: Record<string, string>,
  authHeader?: string
): Promise<APIGatewayProxyResult> => {
  try {
    // Get user from token
    let userEmail = 'shared';
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const getUserResult = await cognitoClient.send(
        new GetUserCommand({ AccessToken: token })
      );
      const emailAttribute = getUserResult.UserAttributes?.find(
        (attr) => attr.Name === 'email'
      );
      userEmail = emailAttribute?.Value || 'shared';
    }

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

    // Sort by date descending (newest first)
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

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { httpMethod, path, body, headers: requestHeaders } = event;
    const referer = requestHeaders?.referer || requestHeaders?.Referer || '';

    if (!checkOrigin(referer) && httpMethod !== 'OPTIONS') {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Access denied' }),
      };
    }

    const headers = getCorsHeaders(referer);

    if (httpMethod === 'OPTIONS') {
      return { statusCode: 200, headers, body: '' };
    }

    if (httpMethod === 'POST' && path === '/auth/login') {
      return login(body || '{}', headers);
    }

    if (httpMethod === 'POST' && path === '/auth/register') {
      return register(body || '{}', headers);
    }

    if (httpMethod === 'POST' && path === '/auth/confirm') {
      return confirmSignup(body || '{}', headers);
    }

    if (httpMethod === 'POST' && path === '/auth/resend') {
      return resendCode(body || '{}', headers);
    }

    if (httpMethod === 'GET' && path === '/auth/verify') {
      return verifyToken(
        headers,
        requestHeaders?.authorization || requestHeaders?.Authorization
      );
    }

    if (httpMethod === 'POST' && path === '/upload') {
      return uploadImage(
        body || '{}',
        headers,
        requestHeaders?.authorization || requestHeaders?.Authorization
      );
    }

    if (httpMethod === 'GET' && path === '/images') {
      return getImages(
        headers,
        requestHeaders?.authorization || requestHeaders?.Authorization
      );
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Not found' }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
