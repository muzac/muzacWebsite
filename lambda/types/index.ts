import { APIGatewayProxyResult } from 'aws-lambda';

export type ApiResponse = APIGatewayProxyResult;

export interface DailyImage {
  date: string;
  url: string;
}
