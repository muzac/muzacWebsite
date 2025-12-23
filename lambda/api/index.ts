import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

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
      // Get all family members
      const result = await docClient.send(new ScanCommand({
        TableName: tableName,
      }));
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ members: result.Items || [] }),
      };
    }

    if (httpMethod === 'POST' && path === '/familyTree') {
      const member = JSON.parse(body || '{}');
      const id = member.id || Date.now().toString();
      
      const familyMember = {
        id,
        name: member.name,
        surname: member.surname,
        nickname: member.nickname || null,
        birthday: member.birthday,
        marriedTo: member.marriedTo || null,
        mom: member.mom || '',
        dad: member.dad || '',
        gender: member.gender,
        photo: member.photo || [],
        createdAt: new Date().toISOString(),
      };
      
      await docClient.send(new PutCommand({
        TableName: tableName,
        Item: familyMember,
      }));

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(familyMember),
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

    if (httpMethod === 'GET' && path.startsWith('/familyTree/children/')) {
      const parentId = path.split('/')[3];
      
      // Query both mom and dad indexes
      const [momResults, dadResults] = await Promise.all([
        docClient.send(new QueryCommand({
          TableName: tableName,
          IndexName: 'MomIndex',
          KeyConditionExpression: 'mom = :parentId',
          ExpressionAttributeValues: {
            ':parentId': parentId,
          },
        })),
        docClient.send(new QueryCommand({
          TableName: tableName,
          IndexName: 'DadIndex',
          KeyConditionExpression: 'dad = :parentId',
          ExpressionAttributeValues: {
            ':parentId': parentId,
          },
        }))
      ]);

      // Combine and deduplicate results
      const allChildren = [...(momResults.Items || []), ...(dadResults.Items || [])];
      const uniqueChildren = allChildren.filter((child, index, self) => 
        index === self.findIndex(c => c.id === child.id)
      );

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ children: uniqueChildren }),
      };
    }

    if (httpMethod === 'GET' && path.startsWith('/familyTree/parents/')) {
      const childId = path.split('/')[3];
      
      // Get the child to find parent IDs
      const childResult = await docClient.send(new GetCommand({
        TableName: tableName,
        Key: { id: childId },
      }));

      if (!childResult.Item) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ parents: [] }),
        };
      }

      const parents = [];
      const { mom, dad } = childResult.Item;
      
      // Get mom if exists
      if (mom) {
        const momResult = await docClient.send(new GetCommand({
          TableName: tableName,
          Key: { id: mom },
        }));
        if (momResult.Item) {
          parents.push(momResult.Item);
        }
      }
      
      // Get dad if exists
      if (dad) {
        const dadResult = await docClient.send(new GetCommand({
          TableName: tableName,
          Key: { id: dad },
        }));
        if (dadResult.Item) {
          parents.push(dadResult.Item);
        }
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ parents }),
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