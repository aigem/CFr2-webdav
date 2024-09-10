import { listAll, fromR2Object, make_resource_path } from '../utils/webdavUtils';
import { logger } from '../utils/logger';
import { generateHTML, generateErrorHTML } from '../utils/templates';

export async function handleWebDAV(request: Request, bucket: R2Bucket): Promise<Response> {
  const SUPPORT_METHODS = ["OPTIONS", "PROPFIND", "MKCOL", "GET", "HEAD", "PUT", "COPY", "MOVE", "DELETE"];
  const DAV_CLASS = "1";

  try {
    switch (request.method) {
      case "OPTIONS":
        return new Response(null, {
          status: 204,
          headers: {
            Allow: SUPPORT_METHODS.join(", "),
            DAV: DAV_CLASS
          }
        });
      case "HEAD":
        return await handle_head(request, bucket);
      case "GET":
        return await handle_get(request, bucket);
      case "PUT":
        return await handle_put(request, bucket);
      case "DELETE":
        return await handle_delete(request, bucket);
      case "MKCOL":
        return await handle_mkcol(request, bucket);
      case "PROPFIND":
        return await handle_propfind(request, bucket);
      case "COPY":
        return await handle_copy(request, bucket);
      case "MOVE":
        return await handle_move(request, bucket);
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

async function handle_get(request: Request, bucket: R2Bucket): Promise<Response> {
  const resource_path = make_resource_path(request);
  
  if (request.url.endsWith("/")) {
    // 处理目录
    let items = [];
    
    if (resource_path !== "") {
      items.push({ name: "📁 ..", href: "../" });
    }
    
    try {
      for await (const object of listAll(bucket, resource_path)) {
        if (object.key === resource_path) continue;
        const isDirectory = object.customMetadata?.resourcetype === "<collection />";
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
  } else {
    // 处理文件
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
}