import * as cdk from 'aws-cdk-lib';
import { Certificate, CertificateValidation } from 'aws-cdk-lib/aws-certificatemanager';
import { HostedZone } from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';

export class CertificateStack extends cdk.Stack {
  public readonly cloudfrontCertificate: Certificate;
  public readonly apiCertificate: Certificate;

  constructor(scope: Construct, id: string, props: cdk.StackProps & { domainName: string; hostedZoneId: string }) {
    super(scope, id, props);

    const hostedZone = HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
      hostedZoneId: props.hostedZoneId,
      zoneName: props.domainName,
    });

    // Certificate for CloudFront (must be in us-east-1)
    this.cloudfrontCertificate = new Certificate(this, 'CloudFrontCertificate', {
      domainName: props.domainName,
      subjectAlternativeNames: [`api.${props.domainName}`],
      validation: CertificateValidation.fromDns(hostedZone),
    });

    new cdk.CfnOutput(this, 'CloudFrontCertificateArn', {
      value: this.cloudfrontCertificate.certificateArn,
      exportName: 'MuzacCloudFrontCertificateArn',
    });
  }
}