#!/bin/bash

set -e

echo "Setting up Remotion Lambda..."

# Set AWS region
export AWS_REGION=us-east-1

# Deploy Remotion Lambda function
echo "Deploying Remotion Lambda function..."
npx remotion lambda functions deploy \
  --region $AWS_REGION \
  --memory 3008 \
  --disk 2048 \
  --timeout 900

# Deploy/Update Remotion site (bundle)
echo "Deploying Remotion site..."
npx remotion lambda sites create frontend/src/remotion/index.ts \
  --region $AWS_REGION \
  --site-name muzac-remotion

echo "Remotion Lambda setup complete!"
echo "Function: remotion-render-4-0-395-mem3008mb-disk2048mb-900sec"
echo "Site URL: https://remotionlambda-useast1-2ev5j44xhc.s3.us-east-1.amazonaws.com/sites/muzac-remotion/index.html"