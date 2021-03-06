import { App } from '@aws-cdk/core'
import * as ssp from '@aws-quickstart/ssp-amazon-eks';
import { TeamPlatform, TeamApplication } from '../teams';

const app = new App();

// Pipeline construct
const account = process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.CDK_DEFAULT_REGION;
const env = { account, region };

const repoUrl = 'https://github.com/aws-samples/ssp-eks-workloads.git'

const bootstrapRepo : ssp.ApplicationRepository = {
    repoUrl,
    path: 'envs/dev'
}

const devBootstrapArgo = new ssp.ArgoCDAddOn({
    bootstrapRepo: {
        ...bootstrapRepo,
        path: 'envs/dev'
    },
    adminPasswordSecretName: 'argo-admin-secret',
});
    
const testBootstrapArgo = new ssp.ArgoCDAddOn({
    bootstrapRepo: {
        ...bootstrapRepo,
        path: 'envs/test'
    },
    adminPasswordSecretName: 'argo-admin-secret',
});   

const prodBootstrapArgo = new ssp.ArgoCDAddOn({
    bootstrapRepo: {
        ...bootstrapRepo,
        path: 'envs/prod'
    },
    adminPasswordSecretName: 'argo-admin-secret',
});

const blueprint = ssp.EksBlueprint.builder()
    .account(account) 
    .region('us-west-2')
    .addOns(
      new ssp.ClusterAutoScalerAddOn
    )
    .teams(new TeamPlatform(String(account)), new TeamApplication('application'));
      
      
// Build code pipeline and add stages
ssp.CodePipelineStack.builder()
    .name("ssp-eks-workshop-pipeline")
    .owner("wellsiau-aws")
    .repository({
        repoUrl: 'my-ssp',
        credentialsSecretName: 'github-token',
        targetRevision: 'main'
    })
    .stage({
      id: 'dev',
      stackBuilder: blueprint.clone('us-west-2')
      .addOns(devBootstrapArgo)
    })
    .stage({
      id: 'test',
      stackBuilder: blueprint.clone('us-east-1')
      .addOns(testBootstrapArgo)
    })
    .stage({
      id: 'prod',
      stackBuilder: blueprint.clone('us-east-2')
      .addOns(prodBootstrapArgo)
    })
    .build(app, 'my-first-stack', {env});