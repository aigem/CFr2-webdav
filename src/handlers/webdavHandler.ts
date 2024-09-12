import { listAll, fromR2Object, make_resource_path, generatePropfindResponse } from '../utils/webdavUtils';
import { logger } from '../utils/logger';
import { generateHTML, generateErrorHTML } from '../utils/templates';
import { authenticate } from '../utils/auth';
import { setCORSHeaders } from '../utils/cors';
import { WebDAVProps, Env } from '../types';

const SUPPORT_METHODS = ["OPTIONS", "PROPFIND", "MKCOL", "GET", "HEAD", "PUT", "COPY", "MOVE", "DELETE"];
const DAV_CLASS = "1, 2";

export async function handleWebDAV(request: Request, env: Env): Promise<Response> {
  const bucket = env.BUCKET;
  const bucketName = env.BUCKET_NAME;

  // 身份验证处理
  if (!authenticate(request, env)) {
    return new Response("Unauthorized", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="WebDAV"' }
    });
  }

  try {
    let response: Response;

    switch (request.method) {
      case "OPTIONS":
        response = handleOptions();
        break;
      case "HEAD":
        response = await handleHead(request, bucket);
        break;
      case "GET":
        response = await handleGet(request, bucket, bucketName);
        break;
      case "PUT":
        response = await handlePut(request, bucket);
        break;
      case "DELETE":
        response = await handleDelete(request, bucket);
        break;
      case "MKCOL":
        response = await handleMkcol(request, bucket);
        break;
      case "PROPFIND":
        response = await handlePropfind(request, bucket, bucketName);
        break;
      case "COPY":
        response = await handleCopy(request, bucket);
        break;
      case "MOVE":
        response = await handleMove(request, bucket);
        break;
      default:
        response = new Response("Method Not Allowed", {
          status: 405,
          headers: {
            Allow: SUPPORT_METHODS.join(", "),
            DAV: DAV_CLASS
          }
        });
    }

    // CORS 头部处理
    setCORSHeaders(response, request);
    return response;

  } catch (error) {
    const err = error as Error;
    logger.error("Error in WebDAV handling:", err);
    return new Response(generateErrorHTML("Internal Server Error", err.message), {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  }
}

function handleOptions(): Response {
  return new Response(null, {
    status: 200,
    headers: {
      Allow: SUPPORT_METHODS.join(", "),
      DAV: DAV_CLASS,
      "MS-Author-Via": "DAV",  // Windows-specific WebDAV header
      "Accept-Ranges": "bytes"  // Enable range requests
    }
  });
}

async function handleHead(request: Request, bucket: R2Bucket): Promise<Response> {
  const path = make_resource_path(request);
  const object = await bucket.head(path);
  if (!object) {
    return new Response("Not Found", { status: 404 });
  }

  return new Response(null, {
    status: 200,
    headers: {
      "Content-Length": object.size.toString(),
      "Content-Type": object.httpMetadata?.contentType || "application/octet-stream",
      "ETag": object.etag,
      "Last-Modified": object.uploaded.toUTCString()
    }
  });
}

async function handleGet(request: Request, bucket: R2Bucket, bucketName: string): Promise<Response> {
  const path = make_resource_path(request);
  const object = await bucket.get(path);
  if (!object) {
    return new Response(generateErrorHTML("Not Found", `The resource at ${path} could not be found.`), {
      status: 404,
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  }

  if (object.writeHttpMetadata) {
    object.writeHttpMetadata(request.headers);
  }

  return new Response(object.body, {
    status: 200,
    headers: {
      "Content-Length": object.size.toString(),
      "Content-Type": object.httpMetadata?.contentType || "application/octet-stream",
      "ETag": object.etag,
      "Last-Modified": object.uploaded.toUTCString()
    }
  });
}

async function handlePut(request: Request, bucket: R2Bucket): Promise<Response> {
  const path = make_resource_path(request);
  const object = await bucket.put(path, request.body, {
    httpMetadata: request.headers
  });

  return new Response(null, {
    status: 201,
    headers: {
      ETag: object.etag,
      "Content-Length": object.size.toString(),
      "Last-Modified": object.uploaded.toUTCString()
    }
  });
}

async function handleDelete(request: Request, bucket: R2Bucket): Promise<Response> {
  const path = make_resource_path(request);
  const object = await bucket.head(path);
  if (!object) {
    return new Response("Not Found", { status: 404 });
  }

  await bucket.delete(path);
  return new Response("Deleted", { status: 204 });
}

async function handleMkcol(request: Request, bucket: R2Bucket): Promise<Response> {
  const path = make_resource_path(request);
  const object = await bucket.head(path);
  if (object) {
    return new Response("Conflict", { status: 409 });
  }

  await bucket.put(path, null);
  return new Response("Collection Created", { status: 201 });
}

async function handlePropfind(request: Request, bucket: R2Bucket, bucketName: string): Promise<Response> {
  const path = make_resource_path(request);
  const object = await bucket.head(path);
  if (!object) {
    return new Response("Not Found", { status: 404 });
  }

  const depth = request.headers.get("Depth") || "1";
  let props: WebDAVProps[] = [];

  if (depth === "1") {
    for await (const obj of listAll(bucket, path)) {
      props.push(fromR2Object(obj));
    }
  } else {
    props.push(fromR2Object(object));
  }

  const propfindResponse = generatePropfindResponse(bucketName, path, props);

  return new Response(propfindResponse, {
    status: 207,
    headers: {
      "Content-Type": "application/xml; charset=utf-8"
    }
  });
}

async function handleCopy(request: Request, bucket: R2Bucket): Promise<Response> {
  const srcPath = make_resource_path(request);
  const dstPath = request.headers.get("Destination");
  if (!dstPath) {
    return new Response("Bad Request", { status: 400 });
  }

  const object = await bucket.get(srcPath);
  if (!object) {
    return new Response("Not Found", { status: 404 });
  }

  await bucket.put(dstPath, object.body, {
    httpMetadata: object.httpMetadata
  });

  return new Response("Copied", { status: 201 });
}

async function handleMove(request: Request, bucket: R2Bucket): Promise<Response> {
  const srcPath = make_resource_path(request);
  const dstPath = request.headers.get("Destination");
  if (!dstPath) {
    return new Response("Bad Request", { status: 400 });
  }

  const object = await bucket.get(srcPath);
  if (!object) {
    return new Response("Not Found", { status: 404 });
  }

  await bucket.put(dstPath, object.body, {
    httpMetadata: object.httpMetadata
  });
  await bucket.delete(srcPath);

  return new Response("Moved", { status: 201 });
}
