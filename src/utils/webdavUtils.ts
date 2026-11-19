// 文件名：src/utils/webdavUtils.ts
import { R2Object } from '@cloudflare/workers-types';
import { WebDAVProps } from '../types';

export function make_resource_path(request: Request): string {
  const url = new URL(request.url);
  return decodeURIComponent(url.pathname.slice(1));
}

export async function* listAll(bucket: R2Bucket, prefix: string) {
  const options = { prefix, delimiter: "/" };
  let result = await bucket.list(options);

  while (result.objects.length > 0) {
    for (const object of result.objects) {
      yield object;
    }

    if (result.truncated && result.cursor) {
      result = await bucket.list({ ...options, cursor: result.cursor });
    } else {
      break;
    }
  }
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
      resourcetype: "collection"
    };
  }
  return {
    creationdate: object.uploaded.toUTCString(),
    displayname: object.key.split('/').pop(),
    getcontentlanguage: object.httpMetadata?.contentLanguage,
    getcontentlength: object.size.toString(),
    getcontenttype: object.httpMetadata?.contentType,
    getetag: object.etag,
    getlastmodified: object.uploaded.toUTCString(),
    resourcetype: object.customMetadata?.resourcetype || ""
  };
}

export function generatePropfindResponse(bucketName: string, basePath: string, props: WebDAVProps[]): string {
  const responses = props.map(prop => generatePropResponse(bucketName, basePath, prop)).join("\n");
  return `<?xml version="1.0" encoding="utf-8" ?>
  <D:multistatus xmlns:D="DAV:">
${responses}
  </D:multistatus>`;
}

/** Escape a value for use as XML text or in an XML attribute. */
export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Percent-encode each path segment, so names with spaces, '&', or non-ASCII survive the href. */
export function encodePath(path: string): string {
  return path.split("/").map(segment => encodeURIComponent(segment)).join("/");
}

function generatePropResponse(bucketName: string, basePath: string, prop: WebDAVProps): string {
  const resourcePath = `/${bucketName}/${basePath}${prop.displayname ? '/' + prop.displayname : ''}`;
  return `  <D:response>
    <D:href>${escapeXml(encodePath(resourcePath))}</D:href>
    <D:propstat>
      <D:prop>
        <D:creationdate>${escapeXml(prop.creationdate)}</D:creationdate>
        <D:getcontentlength>${escapeXml(prop.getcontentlength)}</D:getcontentlength>
        <D:getcontenttype>${escapeXml(prop.getcontenttype || '')}</D:getcontenttype>
        <D:getetag>${escapeXml(prop.getetag || '')}</D:getetag>
        <D:getlastmodified>${escapeXml(prop.getlastmodified)}</D:getlastmodified>
        <D:resourcetype>${prop.resourcetype ? '<D:collection/>' : ''}</D:resourcetype>
      </D:prop>
      <D:status>HTTP/1.1 200 OK</D:status>
    </D:propstat>
  </D:response>`;
}