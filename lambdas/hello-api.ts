import { APIGatewayProxyEventV2 } from "aws-lambda";
import { faker } from "@faker-js/faker";

export const handler = async (e: APIGatewayProxyEventV2) => {
  console.log(e.rawPath);
  console.log(process.env.BUCKET_NAME);

  const animals = Array.from({ length: 20 }, () => faker.animal.fish());
  // console.log(faker.name.fullName());
  return {
    body: JSON.stringify(animals),
    statusCode: 200,
  };
};
