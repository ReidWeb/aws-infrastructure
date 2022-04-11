#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TargetAccountStack } from '../lib/target-account-stack';

const app = new cdk.App();
new TargetAccountStack(app, 'TargetAccountStack', {
	env: {
		region: "eu-west-1",
		// Set by the GitHub Actions. Change accordingly.
		account: process.env.APPLICATION_ACCOUNT_ID
	}
});
