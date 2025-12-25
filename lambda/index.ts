import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { checkOrigin, getCorsHeaders } from './utils/cors';
import {
  login,
  register,
  confirmSignup,
  resendCode,
  verifyToken,
} from './handlers/auth';
import { uploadImage, getImages } from './handlers/images';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { httpMethod, path, body, headers: requestHeaders } = event;
    const referer = requestHeaders?.referer || requestHeaders?.Referer || '';
    console.info(`Received httpMethod: ${httpMethod} path: ${path}`);

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

    const authHeader =
      requestHeaders?.authorization || requestHeaders?.Authorization;

    // Auth routes
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
      return verifyToken(headers, authHeader);
    }

    // Image routes
    if (httpMethod === 'POST' && path === '/upload') {
      return uploadImage(body || '{}', headers, authHeader);
    }
    if (httpMethod === 'GET' && path === '/images') {
      return getImages(headers, authHeader);
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
