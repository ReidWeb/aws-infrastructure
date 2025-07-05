import {RemovalPolicy, Stack, StackProps} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import IRepoMapping from "./config/IRepoMapping";
import {GitHubDeployerRole} from "./git-hub-deployer-role";
import {GithubActionsIdentityProvider} from 'aws-cdk-github-oidc';
import {BlockPublicAccess, Bucket, BucketEncryption} from 'aws-cdk-lib/aws-s3';


export class DeployerAccountStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

	  const provider = new GithubActionsIdentityProvider(this, 'GithubProvider');

	  const username = "ReidWeb"; //Casing is important
	  const repoMappings : IRepoMapping[] = scope.node.tryGetContext(username)

	  const artifactsBucket = new Bucket(this, 'ArtifactsBucket', {
		  bucketName: `reidweb-deploy-${this.region}`,
		  encryption: BucketEncryption.S3_MANAGED,
		  versioned: true,
		  removalPolicy: RemovalPolicy.DESTROY
	  });
	  repoMappings.forEach(repo => {

		  repo.branches.forEach(branch => {

			  new GitHubDeployerRole(this, `${repo.repoName}-${branch.environmentName}-${branch.accountId}-role`, {
				  gitHubUsername: username,
				  gitHubRepo: repo.repoName,
				  environmentName: branch.environmentName,
				  oidcProvider: provider,
				  targetAccountId: branch.accountId,
				  targetAccountRole: repo.roleName,
				  artifactsBucketArn: artifactsBucket.bucketArn
			  })
		  })
	  })

  }
}
