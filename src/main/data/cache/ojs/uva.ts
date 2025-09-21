import { OjProblem, UvaProblem } from '@common/schemas/problems';
import * as cheerio from 'cheerio';
import { UvaResponseDTO } from '../dto/uvaResponseDTO';
import { SOLVED_BUCKET_SIZE } from '@common/constants';
import { OjMeta } from '@common/schemas/ojMeta';
import { sanitizeQuery } from '@main/data/utils';
import { ProfileManager } from '@main/data/managers/profileManager';
import { OjMetaManager } from '@main/data/managers/ojMetaManager';
import Datastore from '@seald-io/nedb';
import { Oj } from '@common/types/oj';

async function downloadUvaProblems() {
  // 1. Download all UVA starred problems from Methods to Solve:
  let response = await fetch('https://cpbook.net/methodstosolve?oj=uva&topic=all&quality=starred');
  const html = await response.text();
  let $ = cheerio.load(html);
  const starredProblems = new Set<number>();
  $('.UVa.starred').each((_, e) => {
    starredProblems.add(parseInt($(e).children('td').first().text().trim()));
  });
  // 2. Download all UVA problems from the uHunt API:
  const problems: UvaProblem[] = [];
  response = await fetch('https://uhunt.onlinejudge.org/api/p');
  const json = (await response.json()) as UvaResponseDTO;
  json.forEach((p) => {
    const newProblem: UvaProblem = {
      oj: 'uva',
      name: p[2],
      path: p[0].toString(),
      info: {
        dacu: p[3],
        starred: starredProblems.has(p[1]),
        solvedBucket: -1,
      },
    };
    problems.push(newProblem);
  });
  problems.sort((a, b) => {
    return a.info.dacu < b.info.dacu ? 1 : -1;
  });
  problems.forEach((p, i) => {
    p.info.solvedBucket = Math.floor(i / SOLVED_BUCKET_SIZE) + 1;
  });
  const stats: OjMeta['uva']['stats'] = {
    solvedBucket: {
      max: Math.floor((problems.length - 1) / SOLVED_BUCKET_SIZE) + 1,
    },
  };
  return {
    problems,
    stats,
  };
}

export async function updateUvaCache(db: Datastore<OjProblem[Oj]>): Promise<OjMeta['uva']> {
  const { problems, stats } = await downloadUvaProblems();
  const meta: OjMeta['uva'] = {
    lastCacheUpdate: Date.now(),
    stats,
  };
  OjMetaManager.instance.updateOjMeta('uva', meta);
  await db.removeAsync({ oj: 'uva' }, { multi: true });
  await db.insertAsync(problems);
  return meta;
}

export async function filterUvaProblems(db: Datastore<OjProblem[Oj]>): Promise<UvaProblem[]> {
  const currProfile = ProfileManager.instance.getCurrProfile()!;
  const filters = currProfile.ojContext['uva'].filters;
  const minsb = filters.solvedBucket.min;
  const maxsb = filters.solvedBucket.max;
  const starred = filters.starred.value;
  const query: Record<string, any> = {
    oj: 'uva',
    'info.solvedBucket': {},
  };
  if (minsb !== '') query['info.solvedBucket'].$gte = minsb;
  if (maxsb !== '') query['info.solvedBucket'].$lte = maxsb;
  if (starred) query['info.starred'] = true;
  sanitizeQuery(query);
  return db.findAsync(query, { _id: 0 });
}
