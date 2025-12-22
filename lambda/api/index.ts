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
    const { httpMethod, path, body } = event;
    
    // CORS headers
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
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
    if (httpMethod === 'GET' && path === '/') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'API is working!' }),
      };
    }

    if (httpMethod === 'POST' && path === '/items') {
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

    if (httpMethod === 'GET' && path.startsWith('/items/')) {
      const id = path.split('/')[2];
      
      const result = await docClient.send(new GetCommand({
        TableName: tableName,
        Key: { id },
      }));

      if (!result.Item) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Item not found' }),
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
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};