/**
 * The properties "timestamp" and "solvedDate" are omitted ***only*** in the cache database to reduce storage usage.
 *
 * In the history tables, each problem snapshot has a manually generated "id".
 * In the cache tables, the "id" is automatically assigned by the database.
 *
 * The only moment when a problem has no "id" is during the short period between
 * being downloaded from the OJ and being inserted into the cache database.
 *
 * The "solvedDate" field is an integer in the format YYYYMMDD,
 * calculated based on the user's local time.
 */

import { Oj } from '@common/types/oj';
import { deepFreeze } from '@common/utils/utils';

type BaseProblem = {
  id?: string;
  name: string;
  path: string;
  solvedDate?: number | null;
  timestamp?: number;
};

export type CfProblem = BaseProblem & {
  oj: 'cf';
  info: {
    solved: number;
    rating: number | null;
    popularity: number;
    tags: string[];
  };
};

export type KattisProblem = BaseProblem & {
  oj: 'kattis';
  info: {
    solved: number;
    submissions: number;
    textDifficulty: string;
    difficulty: number | null;
    popularity: number;
    starred: boolean;
  };
};

export type NepsProblem = BaseProblem & {
  oj: 'neps';
  info: {
    score: number;
    solved: number;
    popularity: number;
  };
};

export type LeetcodeProblem = BaseProblem & {
  oj: 'leetcode';
  info: {
    accepted: number;
    difficulty: number;
    premium: boolean;
    popularity: number;
    submissions: number;
  };
};

export type TimusProblem = BaseProblem & {
  oj: 'timus';
  info: {
    solved: number;
    source: string | null;
    difficulty: number;
    popularity: number;
  };
};

export type UvaProblem = BaseProblem & {
  oj: 'uva';
  info: {
    dacu: number;
    popularity: number;
    starred: boolean;
  };
};

export type OjProblem = {
  cf: CfProblem;
  kattis: KattisProblem;
  neps: NepsProblem;
  leetcode: LeetcodeProblem;
  timus: TimusProblem;
  uva: UvaProblem;
};

/**
 * This is used to simplify SQL queries:
 */

type OjMapping<T extends Oj> = {
  baseFields: Readonly<Array<keyof OjProblem[T]>>;
  infoFields: Readonly<Array<keyof OjProblem[T]['info']>>;
  jsonFields?: Readonly<Array<keyof OjProblem[T]['info']>>;
  booleanFields?: Readonly<Array<keyof OjProblem[T]['info']>>;
};

const baseFields = Object.freeze(['id', 'name', 'path', 'solvedDate', 'timestamp'] as const);

export const OjFields = deepFreeze<{ [T in Oj]: OjMapping<T> }>({
  cf: {
    baseFields,
    infoFields: ['solved', 'rating', 'popularity', 'tags'],
    jsonFields: ['tags'],
  },
  kattis: {
    baseFields,
    infoFields: ['solved', 'submissions', 'textDifficulty', 'difficulty', 'popularity', 'starred'],
    booleanFields: ['starred'],
  },
  neps: {
    baseFields,
    infoFields: ['score', 'solved', 'popularity'],
  },
  leetcode: {
    baseFields,
    infoFields: ['accepted', 'difficulty', 'premium', 'popularity', 'submissions'],
    booleanFields: ['premium'],
  },
  timus: {
    baseFields,
    infoFields: ['solved', 'source', 'difficulty', 'popularity'],
  },
  uva: {
    baseFields,
    infoFields: ['dacu', 'popularity', 'starred'],
    booleanFields: ['starred'],
  },
} as const);
