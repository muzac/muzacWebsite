#!/bin/bash

# Build the Remotion bundle for Lambda
npx remotion lambda sites create frontend/src/remotion/index.ts --site-name=muzac-video

# Deploy the Lambda function
npx remotion lambda functions deploy --memory=3008 --timeout=900