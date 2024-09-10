export function setCORSHeaders(response: Response, request: Request): void {
  const SUPPORT_METHODS = ["OPTIONS", "PROPFIND", "MKCOL", "GET", "HEAD", "PUT", "COPY", "MOVE", "DELETE"];
  
  response.headers.set("Access-Control-Allow-Origin", request.headers.get("Origin") ?? "*");
  response.headers.set("Access-Control-Allow-Methods", SUPPORT_METHODS.join(", "));
  response.headers.set(
    "Access-Control-Allow-Headers",
    ["authorization", "content-type", "depth", "overwrite", "destination", "range"].join(", ")
  );
  response.headers.set(
    "Access-Control-Expose-Headers",
    ["content-type", "content-length", "dav", "etag", "last-modified", "location", "date", "content-range"].join(", ")
  );
  response.headers.set("Access-Control-Allow-Credentials", "false");
  response.headers.set("Access-Control-Max-Age", "86400");
}