import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { renderToString } from "react-dom/server";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import React from "react";

import { getImageUrls } from "./get-image-urls";
import ImageList from "./ImageList";

const wrapInHTML = (content: string, css: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>S3 Image Gallery - Powered by Cloudflare signed cookies</title>
  <style>${css}</style>
</head>
<body>
  ${content} 
</body>
</html>
`;

export const handler = async (
  e: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  // get presigned URL list
  const images = await getImageUrls();

  // get the current directory name
  const __dirname = dirname(fileURLToPath(import.meta.url));

  // convert React to HTML
  const imageHTML = renderToString(<ImageList images={images} />);

  // read the css from public
  const cssString = await readFile(
    // get the full path of css file
    join(__dirname, "./public/style.css"),
    "utf8"
  );

  return {
    body: wrapInHTML(imageHTML, cssString),
    headers: {
      "content-type": "text/html; charset=utf-8",
    },
    statusCode: 200,
  };
};
