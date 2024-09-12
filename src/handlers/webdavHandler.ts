import { listAll, fromR2Object, make_resource_path, generatePropfindResponse } from '../utils/webdavUtils';
import { logger } from '../utils/logger';
import { generateHTML, generateErrorHTML } from '../utils/templates';
import { WebDAVProps } from '../types';

const SUPPORT_METHODS = ["OPTIONS", "PROPFIND", "MKCOL", "GET", "HEAD", "PUT", "COPY", "MOVE", "DELETE"];
const DAV_CLASS = "1, 2";

export async function handleWebDAV(request: Request, bucket: R2Bucket, bucketName: string): Promise<Response> {
  try {
    switch (request.method) {
      case "OPTIONS":
        return handleOptions();
      case "HEAD":
        return await handleHead(request, bucket);
      case "GET":
        return await handleGet(request, bucket, bucketName);
      case "PUT":
        return await handlePut(request, bucket);
      case "DELETE":
        return await handleDelete(request, bucket);
      case "MKCOL":
        return await handleMkcol(request, bucket);
      case "PROPFIND":
        return await handlePropfind(request, bucket, bucketName);
      case "COPY":
        return await handleCopy(request, bucket);
      case "MOVE":
        return await handleMove(request, bucket);
      default:
        return new Response("Method Not Allowed", {
          status: 405,
          headers: {
            Allow: SUPPORT_METHODS.join(", "),
            DAV: DAV_CLASS
          }
        });
    }
  } catch (error) {
    logger.error("Error in WebDAV handling:", error);
    return new Response(generateErrorHTML("Internal Server Error", error.message), {
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
      DAV: DAV_CLASS
    }
  });
}

async function handleHead(request: Request, bucket: R2Bucket): Promise<Response> {
  const resource_path = make_resource_path(request);
  const object = await bucket.head(resource_path);

  if (!object) {
    return new Response(null, { status: 404 });
  }

  return new Response(null, {
    status: 200,
    headers: {
      "Content-Type": object.httpMetadata?.contentType ?? "application/octet-stream",
      "Content-Length": object.size.toString(),
      "ETag": object.etag,
      "Last-Modified": object.uploaded.toUTCString()
    }
  });
}

async function handleGet(request: Request, bucket: R2Bucket, bucketName: string): Promise<Response> {
  const resource_path = make_resource_path(request);

  if (request.url.endsWith("/")) {
    // 处理目录
    return await handleDirectory(bucket, resource_path, bucketName);
  } else {
    // 处理文件
    return await handleFile(bucket, resource_path);
  }
}

async function handleDirectory(bucket: R2Bucket, resource_path: string, bucketName: string): Promise<Response> {
  let items = [];

  if (resource_path !== "") {
    items.push({ name: "📁 ..", href: "../" });
  }

  try {
    for await (const object of listAll(bucket, resource_path)) {
      if (object.key === resource_path) continue;
      const isDirectory = object.customMetadata?.resourcetype === "";
      const displayName = object.key.split('/').pop() || object.key;
      const href = `/${object.key + (isDirectory ? "/" : "")}`;
      items.push({ name: `${isDirectory ? '📁 ' : '📄 '}${displayName}`, href });
    }
  } catch (error) {
    logger.error("Error listing objects:", error);
    return new Response(generateErrorHTML("Error listing directory contents", error.message), {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  }

  const page = generateHTML("WebDAV File Browser", items);
  return new Response(page, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
}

async function handleFile(bucket: R2Bucket, resource_path: string): Promise<Response> {
  try {
    const object = await bucket.get(resource_path);
    if (!object) {
      return new Response("Not Found", { status: 404 });
    }
    return new Response(object.body, {
      status: 200,
      headers: {
        "Content-Type": object.httpMetadata?.contentType ?? "application/octet-stream",
        "Content-Length": object.size.toString(),
        "ETag": object.etag,
        "Last-Modified": object.uploaded.toUTCString()
      }
    });
  } catch (error) {
    logger.error("Error getting object:", error);
    return new Response(generateErrorHTML("Error retrieving file", error.message), {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  }
}

async function handlePut(request: Request, bucket: R2Bucket): Promise<Response> {
  const resource_path = make_resource_path(request);

  try {
    const body = await request.arrayBuffer();
    await bucket.put(resource_path, body, {
      httpMetadata: {
        contentType: request.headers.get("Content-Type") || "application/octet-stream",
      },
    });
    return new Response("Created", { status: 201 });
  } catch (error) {
    logger.error("Error uploading file:", error);
    return new Response(generateErrorHTML("Error uploading file", error.message), {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  }
}

async function handleDelete(request: Request, bucket: R2Bucket): Promise<Response> {
  const resource_path = make_resource_path(request);

  try {
    await bucket.delete(resource_path);
    return new Response("No Content", { status: 204 });
  } catch (error) {
    logger.error("Error deleting object:", error);
    return new Response(generateErrorHTML("Error deleting file", error.message), {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  }
}

async function handleMkcol(request: Request, bucket: R2Bucket): Promise<Response> {
  const resource_path = make_resource_path(request);

  if (resource_path === "") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    await bucket.put(resource_path + "/.keep", new Uint8Array(), {
      customMetadata: { resourcetype: "" }
    });
    return new Response("Created", { status: 201 });
  } catch (error) {
    logger.error("Error creating collection:", error);
    return new Response(generateErrorHTML("Error creating collection", error.message), {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  }
}

async function handlePropfind(request: Request, bucket: R2Bucket, bucketName: string): Promise<Response> {
  const resource_path = make_resource_path(request);
  const depth = request.headers.get("Depth") || "infinity";

  try {
    const props: WebDAVProps[] = [];
    if (depth !== "0") {
      for await (const object of listAll(bucket, resource_path)) {
        props.push(fromR2Object(object));
      }
    } else {
      const object = await bucket.head(resource_path);
      if (object) {
        props.push(fromR2Object(object));
      } else {
        return new Response("Not Found", { status: 404 });
      }
    }

    const xml = generatePropfindResponse(bucketName, resource_path, props);
    logger.info("Generated XML for PROPFIND:", xml); // Add this line for logging
    return new Response(xml, {
      status: 207,
      headers: { "Content-Type": "application/xml; charset=utf-8" }
    });
  } catch (error) {
    logger.error("Error in PROPFIND:", error);
    return new Response(generateErrorHTML("Error in PROPFIND", error.message), {
      status: 500,
      headers: { "Content-Type": "application/xml; charset=utf-8" }
    });
  }
}


async function handleCopy(request: Request, bucket: R2Bucket): Promise<Response> {
  const sourcePath = make_resource_path(request);
  const destinationHeader = request.headers.get("Destination");
  if (!destinationHeader) {
    return new Response("Bad Request: Destination header is missing", { status: 400 });
  }
  const destinationUrl = new URL(destinationHeader);
  const destinationPath = make_resource_path(new Request(destinationUrl));

  try {
    const sourceObject = await bucket.get(sourcePath);
    if (!sourceObject) {
      return new Response("Not Found", { status: 404 });
    }

    await bucket.put(destinationPath, sourceObject.body, {
      httpMetadata: sourceObject.httpMetadata,
      customMetadata: sourceObject.customMetadata
    });

    return new Response("Created", { status: 201 });
  } catch (error) {
    logger.error("Error in COPY:", error);
    return new Response(generateErrorHTML("Error copying file", error.message), {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  }
}

async function handleMove(request: Request, bucket: R2Bucket): Promise<Response> {
  const sourcePath = make_resource_path(request);
  const destinationHeader = request.headers.get("Destination");
  if (!destinationHeader) {
    return new Response("Bad Request: Destination header is missing", { status: 400 });
  }
  const destinationUrl = new URL(destinationHeader);
  const destinationPath = make_resource_path(new Request(destinationUrl));

  try {
    const sourceObject = await bucket.get(sourcePath);
    if (!sourceObject) {
      return new Response("Not Found", { status: 404 });
    }

    await bucket.put(destinationPath, sourceObject.body, {
      httpMetadata: sourceObject.httpMetadata,
      customMetadata: sourceObject.customMetadata
    });

    await bucket.delete(sourcePath);

    return new Response("No Content", { status: 204 });
  } catch (error) {
    logger.error("Error in MOVE:", error);
    return new Response(generateErrorHTML("Error moving file", error.message), {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  }
}
