import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const tableName = process.env.TABLE_NAME!;
  
  try {
    const { httpMethod, path, body, headers: requestHeaders } = event;
    
    // Check if request is from allowed domains
    const referer = requestHeaders?.referer || requestHeaders?.Referer || '';
    const allowedDomains = ['https://muzac.com.tr', 'https://www.muzac.com.tr', 'http://localhost:3000'];
    const isAllowedOrigin = allowedDomains.some(domain => referer.startsWith(domain));
    
    if (!isAllowedOrigin && httpMethod !== 'OPTIONS') {
      return {
        statusCode: 403,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Access denied' }),
      };
    }
    
    // CORS headers - restrict to your domains only
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': referer.startsWith('https://muzac.com.tr') || referer.startsWith('https://www.muzac.com.tr') ? referer.split('/').slice(0, 3).join('/') : 'https://muzac.com.tr',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle OPTIONS request for CORS
    if (httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers,
        body: '',
      };
    }

    // Simple routing
    if (httpMethod === 'GET' && path === '/familyTree') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'Family Tree API is working!' }),
      };
    }

    if (httpMethod === 'POST' && path === '/familyTree') {
      const item = JSON.parse(body || '{}');
      const id = Date.now().toString();
      
      await docClient.send(new PutCommand({
        TableName: tableName,
        Item: { id, ...item },
      }));

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ id, ...item }),
      };
    }

    if (httpMethod === 'GET' && path.startsWith('/familyTree/')) {
      const id = path.split('/')[2];
      
      const result = await docClient.send(new GetCommand({
        TableName: tableName,
        Key: { id },
      }));

      if (!result.Item) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Family member not found' }),
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result.Item),
      };
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
        'Access-Control-Allow-Origin': 'https://muzac.com.tr',
      },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};