import { OjFields, OjProblem } from '@common/schemas/problems';
import { Oj } from '@common/types/oj';
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

/**
 * Returns all columns and values (base + info) for an OJ problem, with JSON and boolean handling.
 */
export function getOjProblemColumnsAndValues<T extends Oj>(problem: OjProblem[T]) {
  const oj = problem.oj as T;
  const mapping = OjFields[oj];
  const columns = [...mapping.baseFields, ...mapping.infoFields] as Array<
    keyof typeof problem | keyof typeof problem.info
  >;
  const values = [
    ...mapping.baseFields.map((f) => problem[f]),
    ...mapping.infoFields.map((f) => {
      const key = f as keyof typeof problem.info;
      const val = problem.info[key];
      if (mapping.jsonFields?.includes(key)) return JSON.stringify(val);
      if (mapping.booleanFields?.includes(key)) return val ? 1 : 0;
      return val;
    }),
  ];
  return { columns, values };
}
