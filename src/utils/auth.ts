// 文件名：src/utils/auth.ts
import { Env } from '../types';

export function authenticate(request: Request, env: Env): boolean {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    return false;
  }

  // Split on the first space only: "Basic" with no value, or a value that is
  // not valid base64, must come back as a failed check (401) and not as an
  // exception out of atob(), which used to surface as a 500.
  const spaceIndex = authHeader.indexOf(' ');
  if (spaceIndex <= 0) {
    return false;
  }
  const authType = authHeader.slice(0, spaceIndex);
  if (authType.toLowerCase() !== 'basic') {
    return false;
  }
  const authValue = authHeader.slice(spaceIndex + 1);
  if (!authValue) {
    return false;
  }

  let decoded: string;
  try {
    decoded = atob(authValue);
  } catch {
    return false;
  }

  // Split on the first colon only: a password is allowed to contain colons
  // (RFC 7617), so everything after the first one is the password.
  const separator = decoded.indexOf(':');
  if (separator < 0) {
    return false;
  }
  const username = decoded.slice(0, separator);
  const password = decoded.slice(separator + 1);
  return username === env.USERNAME && password === env.PASSWORD;
}
