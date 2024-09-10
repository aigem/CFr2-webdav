import { S3Client } from '../utils/s3Client';
import { logger } from '../utils/logger';
import { generateHTML, generateErrorHTML } from '../utils/templates';

export async function handleS3(request: Request, bucket: R2Bucket): Promise<Response> {
  const s3Client = new S3Client(bucket);

  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/s3/, '');

  try {
    switch (request.method) {
      case "GET":
        if (path === '' || path.endsWith('/')) {
          return await listObjects(s3Client, path.slice(1));
        } else {
          return await getObject(s3Client, path.slice(1));
        }
      case "PUT":
        return await putObject(s3Client, path.slice(1), request);
      case "DELETE":
        return await deleteObject(s3Client, path.slice(1));
      default:
        return new Response("Method Not Allowed", { status: 405 });
    }
  } catch (error) {
    logger.error("Error in S3 handling:", error);
    return new Response(generateErrorHTML("Internal Server Error", error.message), {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  }
}

async function listObjects(s3Client: S3Client, prefix: string): Promise<Response> {
  const response = await s3Client.listObjects(prefix);
  let items = [];

  for (const object of response.objects) {
    const isDirectory = object.key.endsWith('/');
    const displayName = object.key.split('/').pop() || object.key;
    items.push({ name: `${isDirectory ? '📁 ' : '📄 '}${displayName}`, href: object.key });
  }

  const page = generateHTML("S3 File Browser", items);
  return new Response(page, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
}

async function getObject(s3Client: S3Client, key: string): Promise<Response> {
  const object = await s3Client.getObject(key);
  if (!object) {
    return new Response("Not Found", { status: 404 });
  }
  return new Response(object.body, {
    status: 200,
    headers: {
      "Content-Type": object.httpMetadata?.contentType || "application/octet-stream",
      "Content-Length": object.size.toString(),
    }
  });
}

async function putObject(s3Client: S3Client, key: string, request: Request): Promise<Response> {
  await s3Client.putObject(key, await request.arrayBuffer());
  return new Response("OK", { status: 200 });
}

async function deleteObject(s3Client: S3Client, key: string): Promise<Response> {
  await s3Client.deleteObject(key);
  return new Response("OK", { status: 200 });
}
