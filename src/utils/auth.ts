import { Env } from '../types';

export function authenticate(request: Request, env: Env): boolean {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    return false;
  }

  const [authType, authValue] = authHeader.split(' ');
  if (authType.toLowerCase() !== 'basic') {
    return false;
  }

  try {
    const [username, password] = atob(authValue).split(':');
    return username === env.USERNAME && password === env.PASSWORD;
  } catch (e) {
    return false;
  }
}
