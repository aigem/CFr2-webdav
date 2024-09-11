import { Env } from '../types';
import { handleWebDAV } from './webdavHandler';
import { authenticate } from '../utils/auth';
import { setCORSHeaders } from '../utils/cors';
import { logger } from '../utils/logger';

export async function handleRequest(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  try {
    if (request.method !== "OPTIONS" && !authenticate(request, env)) {
      return new Response("Unauthorized", {
        status: 401,
        headers: {
          "WWW-Authenticate": 'Basic realm="WebDAV"'
        }
      });
    }

    const response = await handleWebDAV(request, env.BUCKET, env.BUCKET_NAME);

    setCORSHeaders(response, request);
    return response;
  } catch (error) {
    logger.error("Error in request handling:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}