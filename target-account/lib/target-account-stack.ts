import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {Policy, Role} from 'aws-cdk-lib/aws-iam'
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class TargetAccountStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'TargetAccountQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
  }
}
