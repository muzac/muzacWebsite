# Welcome to your CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template




aws sso login --profile amplify-policy-482708015559

# Use the profile
export AWS_PROFILE=amplify-policy-482708015559

# Bootstrap us-east-1 (required for certificates)
cdk bootstrap --region us-east-1

# Now bootstrap and deploy
npm run build:frontend
cdk deploy

git push -u origin main
