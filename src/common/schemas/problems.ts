/**
 * Properties "id", "timestamp" and "solvedDate" will be absent *** ONLY *** in the cache's file, to save space.
 * "solvedDate" is a number in the format YYYYMMDD. It is calculated based on the user's local time.
 */

export type CfProblem = {
  oj: 'cf';
  id?: string;
  name: string;
  path: string;
  solvedDate?: number | null;
  timestamp?: number;
  info: {
    solved: number;
    rating: number | null;
    popularity: number;
    tags: string[];
  };
};

export type KattisProblem = {
  oj: 'kattis';
  id?: string;
  name: string;
  path: string;
  solvedDate?: number | null;
  timestamp?: number;
  info: {
    solved: number;
    submissions: number;
    textDifficulty: string;
    difficulty: number | null;
    popularity: number;
    starred: boolean;
  };
};

export type NepsProblem = {
  oj: 'neps';
  id?: string;
  name: string;
  path: string;
  solvedDate?: number | null;
  timestamp?: number;
  info: {
    score: number;
    solved: number;
    popularity: number;
  };
};

export type LeetcodeProblem = {
  oj: 'leetcode';
  id?: string;
  name: string;
  path: string;
  solvedDate?: number | null;
  timestamp?: number;
  info: {
    accepted: number;
    difficulty: number;
    premium: boolean;
    popularity: number;
    submissions: number;
  };
};

export type TimusProblem = {
  oj: 'timus';
  id?: string;
  name: string;
  path: string;
  solvedDate?: number | null;
  timestamp?: number;
  info: {
    solved: number;
    source: string | null;
    difficulty: number;
    popularity: number;
  };
};

export type UvaProblem = {
  oj: 'uva';
  id?: string;
  name: string;
  path: string;
  solvedDate?: number | null;
  timestamp?: number;
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
