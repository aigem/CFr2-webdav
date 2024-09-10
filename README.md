# WebDAV and S3 Server [免费cfworker应用]

This project implements a WebDAV and S3 compatible server using Cloudflare Workers and R2.

# 一键部署

Description of your project goes here.

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/aigem/r2-webdav-s3)

## Setup

1. Install dependencies:
npm install




2. Configure `wrangler.toml` with your credentials and bucket information.

3. Deploy to Cloudflare Workers:
wrangler publish




## Usage

- WebDAV endpoints are available at the root path.
- S3 compatible endpoints are available under the `/s3` path.

For more detailed usage instructions, please refer to the API documentation.

## Development

To run the project locally:
wrangler dev




## Testing

Run the test suite:
npm test




## License

This project is licensed under the MIT License.
