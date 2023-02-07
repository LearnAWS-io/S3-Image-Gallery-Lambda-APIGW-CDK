import * as cdk from "aws-cdk-lib";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction, OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";
import { HttpApi, HttpMethod } from "@aws-cdk/aws-apigatewayv2-alpha";
import { Construct } from "constructs";
import { HttpLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import { CfnOutput } from "aws-cdk-lib";
import { Bucket } from "aws-cdk-lib/aws-s3";
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class LambdaApiGwCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    const kittyBucket = new Bucket(this, "kitten-gallery");

    const lambdaFn = new NodejsFunction(this, "my-lambda-fn", {
      entry: "lambdas/galleryRendererFn.tsx",
      runtime: Runtime.NODEJS_18_X,

      environment: {
        BUCKET_NAME: kittyBucket.bucketName,
      },
      bundling: {
        target: "esnext",
        format: OutputFormat.ESM,
        // Fix react renderToString dynamic import and others
        banner: `import { createRequire } from 'module';const require = createRequire(import.meta.url);`,
        workingDirectory: "./lambdas",
        commandHooks: {
          afterBundling(inputDir: string, outputDir: string): string[] {
            return [`cp -r ${inputDir}/lambdas/public ${outputDir}/`];
          },
          beforeBundling: () => [],

          beforeInstall: () => [],
        },
      },
    });

    //gives lambda permission to read/write in bucket
    kittyBucket.grantReadWrite(lambdaFn);

    const lambdaInteg = new HttpLambdaIntegration("my-lambda-integ", lambdaFn);

    const apiGw = new HttpApi(this, "first-http-api", {
      apiName: "my-cool-aws-api",
      defaultIntegration: lambdaInteg,
    });

    apiGw.addRoutes({
      path: "/say-hello",
      integration: lambdaInteg,
      methods: [HttpMethod.GET, HttpMethod.POST],
    });

    new CfnOutput(this, "api-url", {
      value: apiGw.url ?? "unknown",
    });
  }
}
