import { Stack, StackProps, aws_iam } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import IRepoMapping from "./config/IRepoMapping";
import {GitHubDeployerRole} from "./git-hub-deployer-role";

export class DeployerAccountStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

	  const gitHubOIDCProvider = new aws_iam.OpenIdConnectProvider(
		  this,
		  "gitHubOIDCProvider",
		  {
			  url: "https://token.actions.githubusercontent.com",
			  clientIds: ["sts.amazonaws.com"]
		  }
	  );

	  const username = "reidweb";
	  const repoMappings : IRepoMapping[] = scope.node.tryGetContext(username)
	  repoMappings.forEach(repo => {
		  repo.branches.forEach(branch => {
			  new GitHubDeployerRole(this, `${repo.repoName}-${branch.branch}-${branch.accountId}-role`, {
				  gitHubBranch: branch.branch,
				  gitHubUsername: username,
				  gitHubRepo: repo.repoName,
				  oidcProvider: gitHubOIDCProvider,
				  targetAccountId: branch.accountId,
				  targetAccountRole: repo.roleName
			  })
		  })
	  })

  }
}
