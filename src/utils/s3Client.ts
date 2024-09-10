export class S3Client {
  private bucket: R2Bucket;

  constructor(bucket: R2Bucket) {
    this.bucket = bucket;
  }

  async listObjects(prefix: string) {
    return this.bucket.list({ prefix });
  }

  async getObject(key: string) {
    return this.bucket.get(key);
  }

  async putObject(key: string, body: ArrayBuffer) {
    return this.bucket.put(key, body);
  }

  async deleteObject(key: string) {
    return this.bucket.delete(key);
  }
}