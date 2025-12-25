import * as cdk from 'aws-cdk-lib';
import {
  Cors,
  DomainName,
  LambdaIntegration,
  RestApi,
} from 'aws-cdk-lib/aws-apigateway';
import {
  Certificate,
  CertificateValidation,
} from 'aws-cdk-lib/aws-certificatemanager';
import {
  Distribution,
  ViewerProtocolPolicy,
  OriginAccessIdentity,
} from 'aws-cdk-lib/aws-cloudfront';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import {
  UserPool,
  UserPoolClient,
  AccountRecovery,
} from 'aws-cdk-lib/aws-cognito';
import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';
import {
  PolicyStatement,
  Role,
  ServicePrincipal,
  ManagedPolicy,
} from 'aws-cdk-lib/aws-iam';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { ARecord, HostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53';
import {
  ApiGatewayDomain,
  CloudFrontTarget,
} from 'aws-cdk-lib/aws-route53-targets';
import { Bucket, HttpMethods } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class MuzacStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const domainName = 'muzac.com.tr';
    const wwwDomainName = 'www.muzac.com.tr';
    const apiSubdomain = 'api.muzac.com.tr';

    // Get existing hosted zone
    const hostedZone = HostedZone.fromLookup(this, 'HostedZone', {
      domainName: domainName,
    });

    // Single certificate for both CloudFront and API Gateway (us-east-1)
    const certificate = new Certificate(this, 'Certificate', {
      domainName: domainName,
      subjectAlternativeNames: [wwwDomainName, apiSubdomain],
      validation: CertificateValidation.fromDns(hostedZone),
    });

    // Cognito User Pool
    const userPool = new UserPool(this, 'UserPool', {
      userPoolName: 'muzac-users',
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      accountRecovery: AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const userPoolClient = new UserPoolClient(this, 'UserPoolClient', {
      userPool,
      generateSecret: false,
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
    });

    // S3 Bucket for images
    const imagesBucket = new Bucket(this, 'ImagesBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      cors: [
        {
          allowedMethods: [HttpMethods.GET, HttpMethods.PUT, HttpMethods.POST],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
        },
      ],
    });

    // S3 Bucket for videos
    const videosBucket = new Bucket(this, 'VideosBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      cors: [
        {
          allowedMethods: [HttpMethods.GET, HttpMethods.PUT, HttpMethods.POST],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
        },
      ],
    });

    // DynamoDB Table for user preferences
    const userPreferencesTable = new Table(this, 'UserPreferencesTable', {
      tableName: 'muzac-user-preferences',
      partitionKey: { name: 'userId', type: AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Remotion Lambda Role (required by Remotion)
    const remotionLambdaRole = new Role(this, 'RemotionLambdaRole', {
      roleName: 'remotion-lambda-role',
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    // Add Remotion Lambda permissions
    remotionLambdaRole.addToPolicy(
      new PolicyStatement({
        actions: [
          's3:GetObject',
          's3:PutObject',
          's3:DeleteObject',
          's3:ListBucket',
          's3:ListAllMyBuckets',
          'lambda:InvokeFunction',
        ],
        resources: ['*'],
      })
    );

    // Lambda Function
    const apiFunction = new NodejsFunction(this, 'ApiFunction', {
      entry: 'lambda/index.ts',
      handler: 'handler',
      functionName: 'muzac-api',
      runtime: Runtime.NODEJS_18_X,
      timeout: cdk.Duration.minutes(15),
      bundling: {
        forceDockerBundling: false,
        minify: false,
        externalModules: ['@aws-sdk/*'],
        nodeModules: ['@remotion/lambda'],
      },
      environment: {
        IMAGES_BUCKET: imagesBucket.bucketName,
        VIDEOS_BUCKET: videosBucket.bucketName,
        USER_POOL_ID: userPool.userPoolId,
        USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
        USER_PREFERENCES_TABLE: userPreferencesTable.tableName,
        REMOTION_AWS_REGION: this.region,
        REMOTION_LAMBDA_ROLE: remotionLambdaRole.roleArn,
        REMOTION_FUNCTION_NAME:
          'remotion-render-4-0-395-mem3008mb-disk2048mb-900sec',
        REMOTION_SERVE_URL:
          'https://remotionlambda-useast1-2ev5j44xhc.s3.us-east-1.amazonaws.com/sites/muzac-remotion/index.html',
      },
    });

    // Grant Lambda permission to access Images S3 bucket
    imagesBucket.grantReadWrite(apiFunction);

    // Grant Lambda permission to access Videos S3 bucket
    videosBucket.grantReadWrite(apiFunction);

    // Grant Lambda permission to access user preferences table
    userPreferencesTable.grantReadWriteData(apiFunction);

    // Grant Lambda permission for Remotion Lambda operations
    apiFunction.addToRolePolicy(
      new PolicyStatement({
        actions: [
          'lambda:InvokeFunction',
          'lambda:CreateFunction',
          'lambda:UpdateFunctionCode',
          'lambda:UpdateFunctionConfiguration',
          'lambda:DeleteFunction',
          'lambda:GetFunction',
          'lambda:ListFunctions',
          'iam:CreateRole',
          'iam:AttachRolePolicy',
          'iam:PassRole',
          's3:GetObject',
          's3:PutObject',
          's3:DeleteObject',
        ],
        resources: ['*'],
      })
    );

    // API Gateway
    const api = new RestApi(this, 'MyApi', {
      restApiName: 'Muzac Backend',
      description: 'API for Muzac',
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS,
      },
    });

    const integration = new LambdaIntegration(apiFunction);
    api.root.addMethod('ANY', integration);
    api.root.addProxy({
      defaultIntegration: integration,
      anyMethod: true,
    });

    // Custom domain for API
    const apiDomain = new DomainName(this, 'ApiDomain', {
      domainName: apiSubdomain,
      certificate: certificate,
    });

    apiDomain.addBasePathMapping(api);

    // Route53 record for API
    new ARecord(this, 'ApiAliasRecord', {
      zone: hostedZone,
      recordName: apiSubdomain,
      target: RecordTarget.fromAlias(new ApiGatewayDomain(apiDomain)),
    });

    // S3 Bucket for frontend
    const websiteBucket = new Bucket(this, 'WebsiteBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Origin Access Identity for CloudFront
    const originAccessIdentity = new OriginAccessIdentity(
      this,
      'OriginAccessIdentity'
    );
    websiteBucket.grantRead(originAccessIdentity);

    // CloudFront Distribution
    const distribution = new Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: new S3Origin(websiteBucket, {
          originAccessIdentity: originAccessIdentity,
        }),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      domainNames: [domainName, wwwDomainName],
      certificate: certificate,
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
      ],
    });

    // Deploy React build to S3
    new BucketDeployment(this, 'DeployWebsite', {
      sources: [Source.asset('./frontend/build')],
      destinationBucket: websiteBucket,
      distribution: distribution,
      distributionPaths: ['/*'],
      prune: true,
      retainOnDelete: false,
    });

    // Route53 record for frontend
    new ARecord(this, 'WebsiteAliasRecord', {
      zone: hostedZone,
      recordName: domainName,
      target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
    });

    // Route53 record for www subdomain
    new ARecord(this, 'WwwWebsiteAliasRecord', {
      zone: hostedZone,
      recordName: wwwDomainName,
      target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
    });

    // Outputs
    new cdk.CfnOutput(this, 'ImagesBucketName', {
      value: imagesBucket.bucketName,
    });
    new cdk.CfnOutput(this, 'BucketName', {
      value: websiteBucket.bucketName,
    });
    new cdk.CfnOutput(this, 'DistributionDomainName', {
      value: distribution.distributionDomainName,
    });
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
    });
    new cdk.CfnOutput(this, 'ApiDomainUrl', {
      value: `https://${apiSubdomain}`,
    });
    new cdk.CfnOutput(this, 'WebsiteUrl', {
      value: `https://${domainName}`,
    });
    new cdk.CfnOutput(this, 'WwwWebsiteUrl', {
      value: `https://${wwwDomainName}`,
    });
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
    });
    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
    });
    new cdk.CfnOutput(this, 'CognitoRegion', {
      value: this.region,
    });
  }
}
