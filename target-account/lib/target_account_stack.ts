
import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Role, ServicePrincipal, Policy, PolicyDocument, PolicyStatement, Effect, ArnPrincipal, CfnRole } from 'aws-cdk-lib/aws-iam';

interface TargetAccountConfig {
  ActionsCrossAccountRoleName: string;
  cloudFormationCrossAccountRoleName: string;
  toolAccountId: string;
  artifactsBucketArn: string;
}

export class TargetAccountStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Get configuration from context
    const config: TargetAccountConfig = scope.node.tryGetContext('targetAccountConfig');
    
    if (!config) {
      throw new Error('targetAccountConfig not found in context. Please check cdk.context.json');
    }

    // CloudFormation Cross-Account Role
    const cloudFormationCrossAccountRole = new Role(this, 'CloudFormationCrossAccountRole', {
      roleName: config.cloudFormationCrossAccountRoleName,
      assumedBy: new ServicePrincipal('cloudformation.amazonaws.com'),
      inlinePolicies: {
        GrantCloudFormationFullAccess: new PolicyDocument({
          statements: [
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: ['*'],
              resources: ['*']
            })
          ]
        })
      }
    });

    // Actions Cross-Account Role with custom trust policy
    const ActionsCrossAccountRole = new Role(this, 'ActionsCrossAccountRole', {
      roleName: config.ActionsCrossAccountRoleName,
      assumedBy: new ArnPrincipal(`arn:aws:iam::${config.toolAccountId}:root`),
    });

    // Override the trust policy to add the condition
    const cfnActionsRole = ActionsCrossAccountRole.node.defaultChild as CfnRole;
    cfnActionsRole.assumeRolePolicyDocument = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: {
            AWS: `arn:aws:iam::${config.toolAccountId}:root`
          },
          Action: 'sts:AssumeRole'
        }
      ]
    };


    // Actions Cross-Account Permission Policy
    new Policy(this, 'ActionsCrossAccountPermissionPolicy', {
      policyName: 'ActionsCrossAccountPermission',
      roles: [ActionsCrossAccountRole],
      document: new PolicyDocument({
        statements: [
          // IAM PassRole for CloudFormation
          new PolicyStatement({
            effect: Effect.ALLOW,
            actions: ['iam:PassRole'],
            resources: [cloudFormationCrossAccountRole.roleArn]
          }),
          // CloudFormation permissions
          new PolicyStatement({
            effect: Effect.ALLOW,
            actions: [
              'cloudformation:CreateChangeSet',
              'cloudformation:DescribeChangeSet',
              'cloudformation:ExecuteChangeSet',
              'cloudformation:DeleteStack',
              'cloudformation:DescribeStackEvents',
              'cloudformation:DescribeStacks',
              'cloudformation:GetTemplate',
              'cloudformation:GetTemplateSummary',
              'cloudformation:DescribeStackResource'
            ],
            resources: ['*']
          }),
          // S3 artifacts bucket permissions
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
              config.artifactsBucketArn,
              `${config.artifactsBucketArn}/*`
            ]
          })
        ]
      })
    });

    // Outputs
    new CfnOutput(this, 'CloudFormationCrossAccountRoleOutput', {
      description: 'ARN of the IAM Role (CloudFormationCrossAccountRole)',
      value: cloudFormationCrossAccountRole.roleArn,
      exportName: 'CloudFormationCrossAccountRole'
    });

    new CfnOutput(this, 'ActionsCrossAccountRoleOutput', {
      description: 'ARN of the IAM Role (ActionsCrossAccountRole)',
      value: ActionsCrossAccountRole.roleArn,
      exportName: 'ActionsCrossAccountRole'
    });
  }
}
