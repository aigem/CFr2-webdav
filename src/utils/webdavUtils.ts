import { WebDAVProps } from '../types';

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

export function fromR2Object(object: R2Object | null): WebDAVProps {
  if (!object) {
    return {
      creationdate: new Date().toUTCString(),
      displayname: undefined,
      getcontentlanguage: undefined,
      getcontentlength: "0",
      getcontenttype: undefined,
      getetag: undefined,
      getlastmodified: new Date().toUTCString(),
      resourcetype: ""
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

export function make_resource_path(request: Request): string {
  let path = new URL(request.url).pathname.slice(1);
  return path.endsWith("/") ? path.slice(0, -1) : path;
}

export function generatePropfindResponse(basePath: string, props: WebDAVProps[]): string {
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<D:multistatus xmlns:D="DAV:">
${props.map(prop => generatePropResponse(basePath, prop)).join('\n')}
</D:multistatus>`;
  return xml;
}

function generatePropResponse(basePath: string, prop: WebDAVProps): string {
  const resourcePath = `/${basePath}${prop.displayname ? '/' + prop.displayname : ''}`;
  return `  <D:response>
    <D:href>${resourcePath}</D:href>
    <D:propstat>
      <D:prop>
        <D:creationdate>${prop.creationdate}</D:creationdate>
        <D:getcontentlength>${prop.getcontentlength}</D:getcontentlength>
        <D:getcontenttype>${prop.getcontenttype || ''}</D:getcontenttype>
        <D:getetag>${prop.getetag || ''}</D:getetag>
        <D:getlastmodified>${prop.getlastmodified}</D:getlastmodified>
        <D:resourcetype>${prop.resourcetype ? '<D:collection/>' : ''}</D:resourcetype>
      </D:prop>
      <D:status>HTTP/1.1 200 OK</D:status>
    </D:propstat>
  </D:response>`;
}