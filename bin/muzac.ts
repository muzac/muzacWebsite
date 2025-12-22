#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { MuzacStack } from '../lib/muzac-stack';

const app = new cdk.App();

// Single stack in us-east-1 (simplifies certificate management)
new MuzacStack(app, 'MuzacStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT || '482708015559',
    region: 'us-east-1',
  },
});