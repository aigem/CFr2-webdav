export async function* listAll(bucket: R2Bucket, prefix: string, isRecursive = false) {
  let cursor: string | undefined = undefined;
  do {
    const r2_objects = await bucket.list({
      prefix,
      delimiter: isRecursive ? undefined : "/",
      cursor,
      include: ["httpMetadata", "customMetadata"]
    });
    for (const object of r2_objects.objects) {
      yield object;
    }
    cursor = r2_objects.truncated ? r2_objects.cursor : undefined;
  } while (cursor);
}

export function fromR2Object(object: R2Object | null) {
  if (!object) {
    return {
      creationdate: new Date().toUTCString(),
      displayname: undefined,
      getcontentlanguage: undefined,
      getcontentlength: "0",
      getcontenttype: undefined,
      getetag: undefined,
      getlastmodified: new Date().toUTCString(),
      resourcetype: "<collection />"
    };
  }
  return {
    creationdate: object.uploaded.toUTCString(),
    displayname: object.httpMetadata?.contentDisposition,
    getcontentlanguage: object.httpMetadata?.contentLanguage,
    getcontentlength: object.size.toString(),
    getcontenttype: object.httpMetadata?.contentType,
    getetag: object.etag,
    getlastmodified: object.uploaded.toUTCString(),
    resourcetype: object.customMetadata?.resourcetype ?? ""
  };
}

export function make_resource_path(request: Request) {
  let path = new URL(request.url).pathname.slice(1);
  return path.endsWith("/") ? path.slice(0, -1) : path;
}