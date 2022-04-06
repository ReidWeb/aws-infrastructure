import { Stack, StackProps } from 'aws-cdk-lib';
import {Construct} from "constructs";
import {IOpenIdConnectProvider, IPrincipal, PolicyDocument, Role, WebIdentityPrincipal, PolicyStatement, Effect} from 'aws-cdk-lib/aws-iam'

export interface GitHubDeployerRoleProps {
	oidcProvider: IOpenIdConnectProvider,
	gitHubUsername: string,
	gitHubRepo: string,
	gitHubBranch: string,
	targetAccountId: string,
	targetAccountRole: string
}

export class GitHubDeployerRole extends Role {

	constructor(scope: Construct, id: string, props: GitHubDeployerRoleProps) {
		super(scope, id, {
			assumedBy: new WebIdentityPrincipal(
				props.oidcProvider.openIdConnectProviderArn,
				{
					StringLike: {
						"token.actions.githubusercontent.com:sub":
						// Notice the `ref:refs`. The `s` in the second `ref` is important!
							`repo:${props.gitHubUsername}/${props.gitHubRepo}:ref:refs/heads/${props.gitHubBranch}`
					}
				}
			),
			path : `/github-actions/`,
			roleName: `${props.targetAccountId}-${props.gitHubUsername}-${props.gitHubRepo}-${props.gitHubBranch}-deployment-role`,
			inlinePolicies: {
				allowAssumeOnAccountB: new PolicyDocument({
					statements: [
						new PolicyStatement({
							effect: Effect.ALLOW,
							actions: ["sts:AssumeRole"],
							resources: [`arn:aws:iam::${props.targetAccountId}:role/${props.targetAccountRole}`]
						})
					]
				})
			}
		});

	}


}
