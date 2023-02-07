import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { defKSUID32 } from "@thi.ng/ksuid";
import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { Bucket, s3Client } from "./get-image-urls";

const ksuid = defKSUID32();

export const handler: APIGatewayProxyHandlerV2 = async () => {
  const res = await createPresignedPost(s3Client, {
    Bucket,
    // filename is variable in s3
    Key: `${ksuid.next()}__\${filename}`,
    // INFO: https://docs.aws.amazon.com/AmazonS3/latest/API/sigv4-HTTPPOSTConstructPolicy.html#sigv4-ConditionMatching
    Conditions: [
      // matches any image
      ["starts-with", "$Content-Type", "image/"],
      // file size limit
      ["content-length-range", 10, 2_000_000],
    ],
    Expires: 20,
  });

  return { body: JSON.stringify(res), statusCode: 200 };
};
