import os from 'node:os'
import path from 'node:path'
import { HASH_RE, JS_TYPES_RE, QUERY_RE } from './constants'


export function slash(p: string): string {
  return p.replace(/\\/g, '/')
}

export const isWindows = os.platform() === 'win32'
export function normalizePath(id: string): string {
  return path.posix.normalize(isWindows ? slash(id) : id)
}


export const isJSRequest = (id: string): boolean => {
  id = cleanUrl(id);
  if (JS_TYPES_RE.test(id)) {
    return true;
  }
  if (!path.extname(id) && !id.endsWith("/")) {
    return true;
  }
  return false;
};

export const cleanUrl = (url: string): string =>
    url.replace(HASH_RE, "").replace(QUERY_RE, "");