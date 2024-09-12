// 文件名：src/utils/cors.ts
export function setCORSHeaders(response: Response, request: Request): void {
  const origin = request.headers.get("Origin");
  if (origin) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  }

  response.headers.set("Access-Control-Allow-Methods", "OPTIONS, PROPFIND, MKCOL, GET, HEAD, PUT, COPY, MOVE, DELETE");
  response.headers.set("Access-Control-Allow-Headers", "Authorization, Content-Type, Depth, Overwrite, Destination, Range");
  response.headers.set("Access-Control-Expose-Headers", "Content-Type, Content-Length, DAV, ETag, Last-Modified, Location, Date, Content-Range");
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set("Access-Control-Max-Age", "86400");
}