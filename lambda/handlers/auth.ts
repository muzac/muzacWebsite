import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  SignUpCommand,
  ConfirmSignUpCommand,
  ResendConfirmationCodeCommand,
  GetUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { ApiResponse } from '../types';

const cognitoClient = new CognitoIdentityProviderClient({});
const userPoolClientId = process.env.USER_POOL_CLIENT_ID!;

export const login = async (
  body: string,
  headers: Record<string, string>
): Promise<ApiResponse> => {
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

export const register = async (
  body: string,
  headers: Record<string, string>
): Promise<ApiResponse> => {
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

export const confirmSignup = async (
  body: string,
  headers: Record<string, string>
): Promise<ApiResponse> => {
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

export const resendCode = async (
  body: string,
  headers: Record<string, string>
): Promise<ApiResponse> => {
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

export const verifyToken = async (
  headers: Record<string, string>,
  authHeader?: string
): Promise<ApiResponse> => {
  try {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ message: 'No token provided' }),
      };
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
