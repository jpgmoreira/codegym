import fs from 'fs';

export function ensureDirExists(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

export function sanitizeQuery(query: Record<string, any>) {
  for (const key in query) {
    if (query[key] && typeof query[key] === 'object' && Object.keys(query[key]).length === 0) {
      delete query[key];
    }
    if (query[key] === undefined) {
      delete query[key];
    }
  }
}
