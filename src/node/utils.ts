import os from 'node:os'
import path from 'node:path'
import { CLIENT_PUBLIC_PATH, HASH_RE, JS_TYPES_RE, QUERY_RE } from './constants'
import { blue, green } from 'picocolors'


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

export const isCSSRequest = (id: string): boolean =>
    cleanUrl(id).endsWith(".css");

export const cleanUrl = (url: string): string =>
    url.replace(HASH_RE, "").replace(QUERY_RE, "");

export function isImportRequest(url: string): boolean {
  return url.endsWith("?import");
}

export function removeImportQuery(url: string): string {
  return url.replace(/\?import$/, "");
}


export function getShortName(file: string, root: string) {
  let symbol = isWindows ? "\\" : '/'
  return file.startsWith(root + `${symbol}` ) ? normalizePath(path.relative(root, file)) : file;
}

const INTERNAL_LIST = [CLIENT_PUBLIC_PATH, "/@react-refresh"];


export function isInternalRequest(url: string): boolean {
  return INTERNAL_LIST.includes(url);
}
