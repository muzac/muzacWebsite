import * as cdk from 'aws-cdk-lib';
import { Cors, DomainName, LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { Certificate, CertificateValidation } from 'aws-cdk-lib/aws-certificatemanager';
import { Distribution, ViewerProtocolPolicy } from 'aws-cdk-lib/aws-cloudfront';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Code, Runtime, Function } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { ARecord, HostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { ApiGatewayDomain, CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets';
import { BlockPublicAccess, Bucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class MuzacStack extends cdk.Stack {
constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const domainName = 'muzac.com.tr';
    const apiSubdomain = 'api.muzac.com.tr';

    // Get existing hosted zone
    const hostedZone = HostedZone.fromLookup(this, 'HostedZone', {
      domainName: domainName,
    });

    // Single certificate for both CloudFront and API Gateway (us-east-1)
    const certificate = new Certificate(this, 'Certificate', {
      domainName: domainName,
      subjectAlternativeNames: [apiSubdomain],
      validation: CertificateValidation.fromDns(hostedZone),
    });

    // DynamoDB Table
    const table = new Table(this, 'MyTable', {
      partitionKey: { name: 'id', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Change for production
    });

    // Lambda Function

    const apiFunction = new NodejsFunction(this, 'ApiFunction', {
      entry: 'lambda/api/index.ts',
      handler: 'handler',
      functionName: 'muzac-api',
      runtime: Runtime.NODEJS_18_X,
      bundling: {
        forceDockerBundling: false,
        minify: false,
        externalModules: ['@aws-sdk/*'],
      },
      environment: {
        TABLE_NAME: table.tableName,
      },
    });

    // Grant Lambda permission to access DynamoDB
    table.grantReadWriteData(apiFunction);

    // API Gateway
    const api = new RestApi(this, 'MyApi', {
      restApiName: 'My Service',
      description: 'API for my app',
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
      target: RecordTarget.fromAlias(
        new ApiGatewayDomain(apiDomain)
      ),
    });

    // S3 Bucket for frontend
    const websiteBucket = new Bucket(this, 'WebsiteBucket', {
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'error.html',
      publicReadAccess: false,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Change for production
      autoDeleteObjects: true, // Change for production
    });

    // CloudFront Distribution
    const distribution = new Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: new S3Origin(websiteBucket),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      domainNames: [domainName],
      certificate: certificate,
      defaultRootObject: 'index.html',
    });

    // Route53 record for frontend
    new ARecord(this, 'WebsiteAliasRecord', {
      zone: hostedZone,
      recordName: domainName,
      target: RecordTarget.fromAlias(
        new CloudFrontTarget(distribution)
      ),
    });

    // Outputs
    new cdk.CfnOutput(this, 'BucketName', {
      value: websiteBucket.bucketName,
    });
    new cdk.CfnOutput(this, 'DistributionDomainName', {
      value: distribution.distributionDomainName,
    });
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
    });
  }
}
