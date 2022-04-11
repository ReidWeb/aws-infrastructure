import { Stack, StackProps } from 'aws-cdk-lib';
import {Construct} from "constructs";
import {IOpenIdConnectProvider, IPrincipal, PolicyDocument, Role, WebIdentityPrincipal, PolicyStatement, Effect} from 'aws-cdk-lib/aws-iam'

export interface GitHubDeployerRoleProps {
	oidcProvider: IOpenIdConnectProvider,
	gitHubUsername: string,
	gitHubRepo: string,
	environmentName: string,
	targetAccountId: string,
	targetAccountRole: string
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
				})
			}
		});

	}


}
