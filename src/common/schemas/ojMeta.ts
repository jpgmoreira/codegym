type RangeStat = { min: number | null; max: number | null };
type MaxStat = { max: number | null };

export type OjMeta = {
  cf: {
    lastCacheUpdate: number | null;
    stats: {
      rating: RangeStat;
      solvedBucket: MaxStat;
    };
    tags: string[];
  };
  neps: {
    lastCacheUpdate: number | null;
    stats: {
      score: RangeStat;
      solvedBucket: MaxStat;
    };
  };
  leetcode: {
    lastCacheUpdate: number | null;
    stats: {
      solvedBucket: MaxStat;
    };
  };
  timus: {
    lastCacheUpdate: number | null;
    stats: {
      difficulty: RangeStat;
      solvedBucket: MaxStat;
    };
  };
  uva: {
    lastCacheUpdate: number | null;
    stats: {
      solvedBucket: MaxStat;
    };
  };
  kattis: {
    lastCacheUpdate: number | null;
    stats: {
      difficulty: RangeStat;
      solvedBucket: MaxStat;
    };
  };
};

export function getEmptyOjMeta(): OjMeta {
  return {
    cf: {
      lastCacheUpdate: null,
      stats: {
        rating: { min: null, max: null },
        solvedBucket: { max: null },
      },
      tags: [],
    },
    neps: {
      lastCacheUpdate: null,
      stats: {
        score: { min: null, max: null },
        solvedBucket: { max: null },
      },
    },
    leetcode: {
      lastCacheUpdate: null,
      stats: {
        solvedBucket: { max: null },
      },
    },
    timus: {
      lastCacheUpdate: null,
      stats: {
        difficulty: { min: null, max: null },
        solvedBucket: { max: null },
      },
    },
    uva: {
      lastCacheUpdate: null,
      stats: {
        solvedBucket: { max: null },
      },
    },
    kattis: {
      lastCacheUpdate: null,
      stats: {
        difficulty: { min: null, max: null },
        solvedBucket: { max: null },
      },
    },
  };
}
