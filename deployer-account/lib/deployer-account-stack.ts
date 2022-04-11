import { Stack, StackProps, aws_iam } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import IRepoMapping from "./config/IRepoMapping";
import {GitHubDeployerRole} from "./git-hub-deployer-role";
import {GithubActionsIdentityProvider, GithubActionsRole} from 'aws-cdk-github-oidc';
import {Effect, Policy} from "aws-cdk-lib/aws-iam";


export class DeployerAccountStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

	  const provider = new GithubActionsIdentityProvider(this, 'GithubProvider');

	  const username = "ReidWeb"; //Casing is important
	  const repoMappings : IRepoMapping[] = scope.node.tryGetContext(username)
	  repoMappings.forEach(repo => {
		  repo.branches.forEach(branch => {
			  new GitHubDeployerRole(this, `${repo.repoName}-${branch.environmentName}-${branch.accountId}-role`, {
				  gitHubUsername: username,
				  gitHubRepo: repo.repoName,
				  environmentName: branch.environmentName,
				  oidcProvider: provider,
				  targetAccountId: branch.accountId,
				  targetAccountRole: repo.roleName
			  })
		  })
	  })

  }
}
