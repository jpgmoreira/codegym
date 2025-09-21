import { SOLVED_BUCKET_SIZE } from '@common/constants';
import { OjProblem, TimusProblem } from '@common/schemas/problems';
import { OjMeta } from '@common/schemas/ojMeta';
import { sanitizeQuery } from '@main/data/utils';
import { ProfileManager } from '@main/data/managers/profileManager';
import { OjMetaManager } from '@main/data/managers/ojMetaManager';
import Datastore from '@seald-io/nedb';
import * as cheerio from 'cheerio';
import { Oj } from '@common/types/oj';

async function downloadTimusProblems() {
  const result = await fetch(
    'https://acm.timus.ru/problemset.aspx?space=1&page=all&skipac=False&sort=id'
  );
  const html = await result.text();
  let $ = cheerio.load(html);
  const problems: TimusProblem[] = [];
  const stats: OjMeta['timus']['stats'] = {
    difficulty: {
      min: Infinity,
      max: -Infinity,
    },
    solvedBucket: {
      max: -Infinity,
    },
  };
  $('tr.content')
    .splice(1)
    .forEach((tr) => {
      const tds = $(tr).children('td');
      const newProblem: TimusProblem = {
        oj: 'timus',
        name: $(tds[2]).text().trim(),
        path: $(tds[1]).text().trim(),
        info: {
          source: $(tds[3]).text().trim() || null,
          solved: parseInt($(tds[4]).text().trim()),
          difficulty: parseInt($(tds[5]).text().trim()),
          solvedBucket: -1,
        },
      };
      stats.difficulty.min = Math.min(stats.difficulty.min!, newProblem.info.difficulty);
      stats.difficulty.max = Math.max(stats.difficulty.max!, newProblem.info.difficulty);
      problems.push(newProblem);
    });
  stats.solvedBucket.max = Math.floor((problems.length - 1) / SOLVED_BUCKET_SIZE) + 1;
  problems.sort((a, b) => {
    return a.info.solved < b.info.solved ? 1 : -1;
  });
  problems.forEach((p, i) => {
    p.info.solvedBucket = Math.floor(i / SOLVED_BUCKET_SIZE) + 1;
  });
  return {
    problems,
    stats,
  };
}

export async function updateTimusCache(db: Datastore<OjProblem[Oj]>): Promise<OjMeta['timus']> {
  const { problems, stats } = await downloadTimusProblems();
  const meta: OjMeta['timus'] = {
    lastCacheUpdate: Date.now(),
    stats,
  };
  OjMetaManager.instance.updateOjMeta('timus', meta);
  await db.removeAsync({ oj: 'timus' }, { multi: true });
  await db.insertAsync(problems);
  return meta;
}

export async function filterTimusProblems(db: Datastore<OjProblem[Oj]>): Promise<TimusProblem[]> {
  const currProfile = ProfileManager.instance.getCurrProfile()!;
  const filters = currProfile.ojContext['timus'].filters;
  const mind = filters.difficulty.min;
  const maxd = filters.difficulty.max;
  const minsb = filters.solvedBucket.min;
  const maxsb = filters.solvedBucket.max;
  const query: Record<string, any> = {
    oj: 'timus',
    'info.difficulty': {},
    'info.solvedBucket': {},
  };
  if (mind !== '') query['info.difficulty'].$gte = mind;
  if (maxd !== '') query['info.difficulty'].$lte = maxd;
  if (minsb !== '') query['info.solvedBucket'].$gte = minsb;
  if (maxsb !== '') query['info.solvedBucket'].$lte = maxsb;
  sanitizeQuery(query);
  return db.findAsync(query, { _id: 0 });
}
