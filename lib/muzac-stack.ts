import * as cdk from 'aws-cdk-lib';
import { Cors, DomainName, LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { Certificate, CertificateValidation } from 'aws-cdk-lib/aws-certificatemanager';
import { Distribution, ViewerProtocolPolicy, OriginAccessIdentity } from 'aws-cdk-lib/aws-cloudfront';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Code, Runtime, Function } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { ARecord, HostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { ApiGatewayDomain, CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets';
import { BlockPublicAccess, Bucket } from 'aws-cdk-lib/aws-s3';
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

    // DynamoDB Table
    const table = new Table(this, 'Muzac', {
      tableName: 'Muzac',
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
      target: RecordTarget.fromAlias(
        new ApiGatewayDomain(apiDomain)
      ),
    });

    // S3 Bucket for frontend
    const websiteBucket = new Bucket(this, 'WebsiteBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Origin Access Identity for CloudFront
    const originAccessIdentity = new OriginAccessIdentity(this, 'OriginAccessIdentity');
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
      target: RecordTarget.fromAlias(
        new CloudFrontTarget(distribution)
      ),
    });

    // Route53 record for www subdomain
    new ARecord(this, 'WwwWebsiteAliasRecord', {
      zone: hostedZone,
      recordName: wwwDomainName,
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
    new cdk.CfnOutput(this, 'ApiDomainUrl', {
      value: `https://${apiSubdomain}`,
    });
    new cdk.CfnOutput(this, 'WebsiteUrl', {
      value: `https://${domainName}`,
    });
    new cdk.CfnOutput(this, 'WwwWebsiteUrl', {
      value: `https://${wwwDomainName}`,
    });
  }
}
