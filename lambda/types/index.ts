import { APIGatewayProxyResult } from 'aws-lambda';

export interface ApiResponse extends APIGatewayProxyResult {}

export interface DailyImage {
  date: string;
  url: string;
}