import { Env } from '../types';

export function authenticate(request: Request, env: Env): boolean {
  const authHeader = request.headers.get("Authorization");
  const expectedAuth = `Basic ${btoa(`${env.USERNAME}:${env.PASSWORD}`)}`;
  return authHeader === expectedAuth;
}