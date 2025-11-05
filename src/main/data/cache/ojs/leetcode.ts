import { LeetcodeProblem, OjProblem } from '@common/schemas/problems';
import { LeetcodeResponseDTO } from '../dto/leetcodeResponseDTO';
import { OjMeta } from '@common/schemas/ojMeta';
import { POPULARITY_GROUP_SIZE } from '@common/constants';
import { sanitizeQuery } from '@main/data/utils';
import { ProfileManager } from '@main/data/managers/profileManager';
import { OjMetaManager } from '@main/data/managers/ojMetaManager';
import { type Database } from 'sqlite';
import { Oj } from '@common/types/oj';
import { replaceCacheProblems } from '@main/data/sql/cache';

async function downloadLeetcodeProblems() {
  const response = await fetch('https://leetcode.com/api/problems/all/');
  const json = (await response.json()) as LeetcodeResponseDTO;
  const problemset = json.stat_status_pairs;
  const problems: LeetcodeProblem[] = [];
  const stats: OjMeta['leetcode']['stats'] = {
    popularity: {
      max: Math.floor((problemset.length - 1) / POPULARITY_GROUP_SIZE) + 1,
    },
  };
  problemset.forEach((p) => {
    const newProblem: LeetcodeProblem = {
      oj: 'leetcode',
      name: p.stat.question__title,
      path: p.stat.question__title_slug,
      info: {
        accepted: p.stat.total_acs,
        submissions: p.stat.total_submitted,
        difficulty: p.difficulty.level,
        premium: p.paid_only,
        popularity: -1,
      },
    };
    problems.push(newProblem);
  });
  problems.sort((a, b) => {
    return a.info.accepted < b.info.accepted ? 1 : -1;
  });
  problems.forEach((p, i) => {
    p.info.popularity = Math.floor(i / POPULARITY_GROUP_SIZE) + 1;
  });
  return {
    problems,
    stats,
  };
}

export async function updateLeetcodeCache(db: Database): Promise<OjMeta['leetcode']> {
  const { problems, stats } = await downloadLeetcodeProblems();
  const meta: OjMeta['leetcode'] = {
    lastCacheUpdate: Date.now(),
    stats,
  };
  OjMetaManager.instance.updateOjMeta('leetcode', meta);
  await replaceCacheProblems(db, 'leetcode', problems);
  return meta;
}

export async function filterLeetcodeProblems(
  db: Datastore<OjProblem[Oj]>
): Promise<LeetcodeProblem[]> {
  const currProfile = ProfileManager.instance.getCurrProfile()!;
  const filters = currProfile.ojContext['leetcode'].filters;
  const minsb = filters.popularity.min;
  const maxsb = filters.popularity.max;
  const premium = filters.premium.value;
  const difficulties = filters.difficulty.values
    .map((d) => {
      if (d === 'easy') return 1;
      if (d === 'medium') return 2;
      return 3;
    })
    .filter((x) => x !== undefined);
  const query: Record<string, any> = {
    oj: 'leetcode',
    'info.popularity': {},
  };
  if (minsb !== '') query['info.popularity'].$gte = minsb;
  if (maxsb !== '') query['info.popularity'].$lte = maxsb;
  if (premium === 'yes') query['info.premium'] = true;
  if (premium === 'no') query['info.premium'] = false;
  if (difficulties.length) query['info.difficulty'] = { $in: difficulties };
  sanitizeQuery(query);
  return db.findAsync(query, { _id: 0 });
}
