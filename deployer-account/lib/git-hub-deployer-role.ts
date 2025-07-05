import { Stack, StackProps } from 'aws-cdk-lib';
import {Construct} from "constructs";
import {IOpenIdConnectProvider, IPrincipal, PolicyDocument, Role, WebIdentityPrincipal, PolicyStatement, Effect} from 'aws-cdk-lib/aws-iam'

export interface GitHubDeployerRoleProps {
	oidcProvider: IOpenIdConnectProvider,
	gitHubUsername: string,
	gitHubRepo: string,
	environmentName: string,
	targetAccountId: string,
	targetAccountRole: string,
	cloudFormationExecutionRoleArn?: string,
	artifactsBucketArn?: string
}

export class GitHubDeployerRole extends Role {

	constructor(scope: Construct, id: string, props: GitHubDeployerRoleProps) {
		super(scope, id, {
			assumedBy: new WebIdentityPrincipal(
				props.oidcProvider.openIdConnectProviderArn,
				{
					"ForAllValues:StringEquals": {
						"token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
						"token.actions.githubusercontent.com:sub":
							`repo:${props.gitHubUsername}/${props.gitHubRepo}:environment:${props.environmentName}`
					}
				}
			),
			path : `/github-actions/${props.gitHubUsername}/`,
			roleName: `${props.gitHubRepo}-${props.environmentName}-deployment-role`,
			inlinePolicies: {
				allowAssumeOnAccountB: new PolicyDocument({
					statements: [
						new PolicyStatement({
							effect: Effect.ALLOW,
							actions: ["sts:AssumeRole"],
							resources: [`arn:aws:iam::${props.targetAccountId}:role/*`] //TODO: Must tighten this up
						})
					]
				}),
				pipelineExecutionPermissions: new PolicyDocument({
					statements: [
						// Pass role for CloudFormation execution
						...(props.cloudFormationExecutionRoleArn ? [
							new PolicyStatement({
								effect: Effect.ALLOW,
								actions: ['iam:PassRole'],
								resources: [props.cloudFormationExecutionRoleArn]
							})
						] : []),
						// CloudFormation operations
						new PolicyStatement({
							effect: Effect.ALLOW,
							actions: [
								"cloudformation:CreateChangeSet",
								"cloudformation:DescribeChangeSet",
								"cloudformation:ExecuteChangeSet",
								"cloudformation:DeleteStack",
								"cloudformation:DescribeStackEvents",
								"cloudformation:DescribeStacks",
								"cloudformation:GetTemplate",
								"cloudformation:GetTemplateSummary",
								"cloudformation:DescribeStackResource"
							],
							resources: ['*']
						}),
						// S3 artifacts bucket access
						...(props.artifactsBucketArn ? [
							new PolicyStatement({
								effect: Effect.ALLOW,
								actions: [
									's3:DeleteObject',
									's3:GetObject*',
									's3:PutObject*',
									's3:GetBucket*',
									's3:List*'
								],
								resources: [
									props.artifactsBucketArn,
									`${props.artifactsBucketArn}/*`
								]
							})
						] : [])
					]
				})
			}
		});
	}
}