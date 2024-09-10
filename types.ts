export interface Env {
  bucket: R2Bucket;
  USERNAME: string;
  PASSWORD: string;
}

export interface CacheableResponse {
  response: Response;
  expiry: number;
}