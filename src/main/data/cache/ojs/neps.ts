import { NepsProblem, OjProblem } from '@common/schemas/problems';
import { NepsResponseDTO } from '../dto/nepsResponseDTO';
import { OjMeta } from '@common/schemas/ojMeta';
import { POPULARITY_GROUP_SIZE } from '@common/constants';
import { OjMetaManager } from '@main/data/managers/ojMetaManager';
import { ProfileManager } from '@main/data/managers/profileManager';
import { sanitizeQuery } from '@main/data/utils';
import { Oj } from '@common/types/oj';
import { type Database } from 'sqlite';
import { replaceCacheProblems } from '@main/data/sql/cache';

async function downloadNepsProblems() {
  const response = await fetch('https://api.neps.academy/tables/exercises?query');
  const json = (await response.json()) as NepsResponseDTO;
  const problemset = json.data;
  const problems: NepsProblem[] = [];
  const stats: OjMeta['neps']['stats'] = {
    score: {
      min: Infinity,
      max: -Infinity,
    },
    popularity: {
      max: Math.floor((problemset.length - 1) / POPULARITY_GROUP_SIZE) + 1,
    },
  };
  problemset.forEach((p) => {
    const newProblem: NepsProblem = {
      oj: 'neps',
      name: p.title.value,
      path: p.id.toString(),
      info: {
        score: p.score,
        solved: p.solved,
        popularity: -1,
      },
    };
    problems.push(newProblem);
    if (newProblem.info.score != null) {
      stats.score.min = Math.min(stats.score.min!, newProblem.info.score);
      stats.score.max = Math.max(stats.score.max!, newProblem.info.score);
    }
  });
  problems.sort((a, b) => {
    return a.info.solved < b.info.solved ? 1 : -1;
  });
  problems.forEach((p, i) => {
    p.info.popularity = Math.floor(i / POPULARITY_GROUP_SIZE) + 1;
  });
  return {
    problems,
    stats,
  };
}

export async function updateNepsCache(db: Database): Promise<OjMeta['neps']> {
  const { problems, stats } = await downloadNepsProblems();
  const meta: OjMeta['neps'] = {
    lastCacheUpdate: Date.now(),
    stats,
  };
  OjMetaManager.instance.updateOjMeta('neps', meta);
  await replaceCacheProblems(db, 'neps', problems);
  return meta;
}

export async function filterNepsProblems(db: Datastore<OjProblem[Oj]>): Promise<NepsProblem[]> {
  const currProfile = ProfileManager.instance.getCurrProfile()!;
  const filters = currProfile.ojContext['neps'].filters;
  const mins = filters.score.min;
  const maxs = filters.score.max;
  const minsb = filters.popularity.min;
  const maxsb = filters.popularity.max;
  const query: Record<string, any> = {
    oj: 'neps',
    'info.score': {},
    'info.popularity': {},
  };
  if (mins !== '') query['info.score'].$gte = mins;
  if (maxs !== '') query['info.score'].$lte = maxs;
  if (minsb !== '') query['info.popularity'].$gte = minsb;
  if (maxsb !== '') query['info.popularity'].$lte = maxsb;
  sanitizeQuery(query);
  return db.findAsync(query, { _id: 0 });
}
