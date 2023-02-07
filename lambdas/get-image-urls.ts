import {
  GetObjectCommand,
  // GetObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { z } from "zod";

// import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const s3Client = new S3Client({
  region: "us-east-1",
  // TODO: If AWS CLI not configured, put your credentials with S3 acess in ENV
  /**
  credentials: {
    accessKeyId: import.meta.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.AWS_SECRET_ACCESS_KEY,
  },
  **/
});

const envSchema = z.object({
  BUCKET_NAME: z.string(),
});

export const { BUCKET_NAME: Bucket } = envSchema.parse(process.env);

export const getImageUrls = async () => {
  const listCmd = new ListObjectsV2Command({
    Bucket,
  });

  const { Contents } = await s3Client.send(listCmd);

  if (!Contents) {
    throw Error("no objects returned from s3");
  }

  //  INFO: uncomment to use S3 presigned URLs

  const signedURLReqs = [];

  for (let index = 0; index < Contents.length; index++) {
    const key = Contents[index].Key;
    const getObjCmd = new GetObjectCommand({ Bucket, Key: key });
    signedURLReqs.push(getSignedUrl(s3Client, getObjCmd, { expiresIn: 3600 }));
  }

  return Promise.all(signedURLReqs);

  // const imageList = Contents.slice(1);
  // return imageList.map((obj) => obj.Key);
};
