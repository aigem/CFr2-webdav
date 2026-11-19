// 文件名：src/utils/webdavUtils.ts
import { R2Object } from '@cloudflare/workers-types';
import { WebDAVProps } from '../types';

export function make_resource_path(request: Request): string {
  const url = new URL(request.url);
  return decodeURIComponent(url.pathname.slice(1));
}

/** 一条列表记录：要么是一个对象，要么是一个目录（R2 以 common prefix 的形式返回）。 */
export interface R2ListEntry {
  key: string;
  isDirectory: boolean;
  object: R2Object | null;
}

export async function* listAll(bucket: R2Bucket, prefix: string): AsyncGenerator<R2ListEntry> {
  const options = { prefix, delimiter: "/" };
  const seen = new Set<string>();
  let cursor: string | undefined;

  do {
    const result = await bucket.list({ ...options, cursor });

    for (const object of result.objects) {
      if (seen.has(object.key)) continue;
      seen.add(object.key);
      yield {
        key: object.key,
        isDirectory: object.key.endsWith("/") || object.customMetadata?.resourcetype === "collection",
        object
      };
    }

    // R2 把子目录放在 delimitedPrefixes 里返回，而不是作为对象返回：
    // 不处理它们，目录既不会出现在列表里，也不会出现在 PROPFIND 的结果里。
    for (const key of result.delimitedPrefixes) {
      if (seen.has(key)) continue;
      seen.add(key);
      yield { key, isDirectory: true, object: null };
    }

    // 以 truncated/cursor 为准，而不是以本页的对象数量为准：
    // 某一页只有 common prefix 而没有对象时，用对象数量判断会提前结束，漏掉后面的页。
    cursor = result.truncated && result.cursor ? result.cursor : undefined;
  } while (cursor);
}

export function fromR2Object(object: R2Object | null, key = object?.key ?? ""): WebDAVProps {
  if (!object) {
    return {
      creationdate: new Date().toUTCString(),
      displayname: key.replace(/\/+$/, "").split("/").pop(),
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
    displayname: object.key.replace(/\/+$/, "").split("/").pop(),
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

function generatePropResponse(bucketName: string, basePath: string, prop: WebDAVProps): string {
  const isCollection = prop.resourcetype === "collection";
  const name = prop.displayname ?? "";
  const base = basePath ? `/${basePath.replace(/\/+$/, "")}` : "";
  const resourcePath = name
    ? `/${bucketName}${base}/${name}${isCollection ? "/" : ""}`
    : `/${bucketName}${base}${isCollection ? "/" : ""}`;
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