import { defineStore } from 'pinia';
import { StartupData } from '@common/schemas/startup';
import { getEmptyOjMeta, OjMeta } from '@common/schemas/ojMeta';
import { Oj } from '@common/types/oj';

export const useOjMetaStore = defineStore('ojMeta', {
  state: getEmptyOjMeta,
  actions: {
    initFromStartupData(data: StartupData) {
      Object.assign(this, data.ojMeta);
    },
    updateOjMeta<T extends Oj>(oj: T, data: OjMeta[T]) {
      this.$state[oj] = data;
    },
  },
});
