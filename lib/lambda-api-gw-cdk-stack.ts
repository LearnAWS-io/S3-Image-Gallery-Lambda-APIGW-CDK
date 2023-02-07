import * as cdk from "aws-cdk-lib";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction, OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";
import { HttpApi, HttpMethod } from "@aws-cdk/aws-apigatewayv2-alpha";
import { Construct } from "constructs";
import { HttpLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import { CfnOutput } from "aws-cdk-lib";
import { BlockPublicAccess, Bucket, HttpMethods } from "aws-cdk-lib/aws-s3";
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class LambdaApiGwCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // create and s3 bucket to store our images
    const s3ImgBucket = new Bucket(this, "img-gallery", {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    });

    const galleryRendererFn = new NodejsFunction(
      this,
      "image-gallery-renderer",
      {
        entry: "lambdas/galleryRendererFn.tsx",
        runtime: Runtime.NODEJS_18_X,

        environment: {
          BUCKET_NAME: s3ImgBucket.bucketName,
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
      }
    );

    const getImgUploadUrlFn = new NodejsFunction(this, "get-img-upload-url", {
      entry: "lambdas/s3ImgUploadUrlFn.ts",
      runtime: Runtime.NODEJS_18_X,

      environment: {
        BUCKET_NAME: s3ImgBucket.bucketName,
      },
      bundling: {
        target: "esnext",
        format: OutputFormat.ESM,
      },
    });

    //gives lambda permission to read/write in bucket
    s3ImgBucket.grantReadWrite(galleryRendererFn);
    s3ImgBucket.grantWrite(getImgUploadUrlFn);

    const imgRendererInteg = new HttpLambdaIntegration(
      "img-renderer-integration",
      galleryRendererFn
    );

    const imgUrlGenInteg = new HttpLambdaIntegration(
      "img-url-gen-integ",
      getImgUploadUrlFn
    );

    const apiGw = new HttpApi(this, "first-http-api", {
      apiName: "my-cool-aws-api",
      defaultIntegration: imgRendererInteg,
    });

    if (!apiGw.url) {
      throw Error("Unable to get api gateway url");
    }

    // add cors to S3
    s3ImgBucket.addCorsRule({
      allowedMethods: [HttpMethods.POST, HttpMethods.PUT],
      allowedOrigins: [apiGw.url.slice(0, -1)],
      allowedHeaders: ["*"],
    });

    apiGw.addRoutes({
      path: "/get-upload-url",
      integration: imgUrlGenInteg,
      methods: [HttpMethod.GET],
    });

    new CfnOutput(this, "api-url", {
      value: apiGw.url ?? "unknown",
    });
  }
}
