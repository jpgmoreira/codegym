import { CfProblem } from '@common/schemas/problems';
import { CfResponseDTO } from '../dto/cfResponseDTO';
import { OjMeta } from '@common/schemas/ojMeta';
import { POPULARITY_GROUP_SIZE } from '@common/constants';
import { OjMetaManager } from '@main/data/managers/ojMetaManager';
import { sanitizeQuery } from '@main/data/utils';
import { ProfileManager } from '@main/data/managers/profileManager';
import type { Database } from 'sqlite';
import { replaceCacheProblems } from '@main/data/sql/cache';

async function downloadCfProblems() {
  const response = await fetch('https://codeforces.com/api/problemset.problems');
  const json = (await response.json()) as CfResponseDTO;
  const problemset = json.result.problems;
  const problemStatistics = json.result.problemStatistics;
  const problems: CfProblem[] = [];
  const stats: OjMeta['cf']['stats'] = {
    rating: {
      min: Infinity,
      max: -Infinity,
    },
    popularity: {
      max: Math.floor((problemset.length - 1) / POPULARITY_GROUP_SIZE) + 1,
    },
  };
  const tagsSet = new Set<string>();
  for (let i = 0; i < problemset.length; i++) {
    let contestId = problemset[i].contestId;
    if (contestId === undefined) contestId = problemStatistics[i].contestId;
    let index = problemset[i].index;
    if (index === undefined) index = problemStatistics[i].index;
    const path = `${contestId}/${index}`;
    const newProblem: CfProblem = {
      oj: 'cf',
      name: problemset[i].name,
      path,
      info: {
        rating: problemset[i].rating || null,
        tags: problemset[i].tags,
        solved: problemStatistics[i].solvedCount,
        popularity: -1,
      },
    };
    if (newProblem.info.rating != null) {
      stats.rating.min = Math.min(stats.rating.min!, newProblem.info.rating);
      stats.rating.max = Math.max(stats.rating.max!, newProblem.info.rating);
    }
    newProblem.info.tags.forEach((t) => tagsSet.add(t.toLowerCase()));
    problems.push(newProblem);
  }
  problems.sort((a, b) => {
    return a.info.solved < b.info.solved ? 1 : -1;
  });
  problems.forEach((p, i) => {
    p.info.popularity = Math.floor(i / POPULARITY_GROUP_SIZE) + 1;
  });
  return {
    problems,
    stats,
    tags: Array.from(tagsSet),
  };
}

export async function updateCfCache(db: Database): Promise<OjMeta['cf']> {
  const { problems, stats, tags } = await downloadCfProblems();
  const meta: OjMeta['cf'] = {
    lastCacheUpdate: Date.now(),
    stats,
    tags,
  };
  OjMetaManager.instance.updateOjMeta('cf', meta);
  await replaceCacheProblems(db, 'cf', problems);
  return meta;
}

export async function filterCfProblems(db: Database): Promise<CfProblem[]> {
  const currProfile = ProfileManager.instance.getCurrProfile()!;
  const filters = currProfile.ojContext['cf'].filters;
  const tags = filters.tags.values;
  const minr = filters.rating.min;
  const maxr = filters.rating.max;
  const minsb = filters.popularity.min;
  const maxsb = filters.popularity.max;
  const query: Record<string, any> = {
    oj: 'cf',
    'info.rating': {},
    'info.popularity': {},
  };
  if (minr !== '') query['info.rating'].$gte = minr;
  if (maxr !== '') query['info.rating'].$lte = maxr;
  if (minsb !== '') query['info.popularity'].$gte = minsb;
  if (maxsb !== '') query['info.popularity'].$lte = maxsb;
  if (tags.length) {
    query.$where = function () {
      return tags.every((t: string) => (this as CfProblem).info.tags.includes(t));
    };
  }
  sanitizeQuery(query);
  return db.findAsync(query, { _id: 0 });
}
