export function setCORSHeaders(response: Response, request: Request): void {
  const SUPPORT_METHODS = ["OPTIONS", "PROPFIND", "MKCOL", "GET", "HEAD", "PUT", "COPY", "MOVE", "DELETE"];
  
  const origin = request.headers.get("Origin");
  if (origin) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  }

  response.headers.set("Access-Control-Allow-Methods", SUPPORT_METHODS.join(", "));
  response.headers.set(
    "Access-Control-Allow-Headers",
    ["Authorization", "Content-Type", "Depth", "Overwrite", "Destination", "Range"].join(", ")
  );
  response.headers.set(
    "Access-Control-Expose-Headers",
    ["Content-Type", "Content-Length", "DAV", "ETag", "Last-Modified", "Location", "Date", "Content-Range"].join(", ")
  );
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set("Access-Control-Max-Age", "86400");
}