import {
  CognitoIdentityProviderClient,
  GetUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { APIGatewayProxyEvent } from 'aws-lambda';

const cognitoClient = new CognitoIdentityProviderClient({});

interface User {
  email: string;
  sub: string;
}

export const verifyToken = async (
  event: APIGatewayProxyEvent
): Promise<User | null> => {
  try {
    const authHeader =
      event.headers?.authorization || event.headers?.Authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);

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
      email: email || '',
      sub: getUserResult.Username || '',
    };
  } catch {
    return null;
  }
};
