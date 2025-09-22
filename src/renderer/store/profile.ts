import { defineStore } from 'pinia';
import { AuthPage } from '@common/types/authPage';
import { getEmptyProfileRegistry, Profile } from '@common/schemas/profile';
import { StartupData } from '@common/schemas/startup';
import { Oj } from '@common/types/oj';
import { Channels } from '@common/types/channels';
import { CreateProfileResponseDTO } from '@common/dto/createProfileResponseDTO';
import { useOjStatusStore } from './ojStatus';
import { useOjMetaStore } from './ojMeta';
import { useHistoryStore } from './history';
import { useGraphStore } from './graph';
import { GetOjProblemResponseDTO } from '@common/dto/getOjProblemResponseDTO';
import { getTodayDate } from '@common/utils/dateUtils';
import { getEmptyGraphRecord } from '@common/schemas/graph';
import { toRaw } from 'vue';
import { OjProblem } from '@common/schemas/problems';
import { GenericResponseDTO } from '@common/dto/genericResponseDTO';

export const useProfileStore = defineStore('profile', {
  state: () => ({
    currProfile: null as Profile | null,
    registry: getEmptyProfileRegistry(),
  }),
  actions: {
    initFromStartupData(data: StartupData) {
      this.currProfile = data.currProfile;
      this.registry = data.profileRegistry;
    },
    updateCurrPage(newPage: AuthPage) {
      this.currProfile!.page = newPage;
      window.api.send(Channels.updateCurrPage, newPage);
    },
    updateCurrOj(oj: Oj) {
      this.currProfile!.currOj = oj;
      window.api.send(Channels.updateCurrOj, oj);
    },
    async createProfile(name: string) {
      const result = await window.api.invoke<CreateProfileResponseDTO>(
        Channels.createProfile,
        name
      );
      if (result.status === 'success') {
        this.initFromStartupData(result.data);
      }
      return result;
    },
    async login(profileId: string) {
      const result = await window.api.invoke<StartupData>(Channels.login, profileId);
      this.initFromStartupData(result);
      return result;
    },
    async requestNewProblem() {
      const oj = this.currProfile!.currOj;
      const ojStatusStore = useOjStatusStore();
      const ojMetaStore = useOjMetaStore();
      const historyStore = useHistoryStore();
      let result: GetOjProblemResponseDTO<typeof oj>;
      if (!ojMetaStore[oj].lastCacheUpdate) {
        try {
          await ojStatusStore.updateOjCache(oj);
        } catch {
          return;
        }
      }
      try {
        result = await ojStatusStore.requestNewProblem(oj);
      } catch {
        return;
      }
      const { snapshot, matched } = result;
      const { ojContext } = this.currProfile!;
      ojContext[oj].matched = matched;
      ojContext[oj].snapshot = snapshot;
      if (snapshot) {
        historyStore.insertRecord(oj, snapshot);
      }
    },
    setCurrSnapshotSolved(value: boolean) {
      const graphStore = useGraphStore();
      const currOj = this.currProfile!.currOj;
      const ojContext = this.currProfile!.ojContext[currOj];
      const snapshot = ojContext.snapshot;
      if (!snapshot) return;
      const prevSolvedDate = snapshot.solvedDate;
      if (prevSolvedDate != null) {
        const record = graphStore.findGraphRecord(prevSolvedDate);
        if (record) record[currOj]--;
      }
      const today = getTodayDate();
      if (value) {
        let record = graphStore.findGraphRecord(today);
        if (!record) {
          record = getEmptyGraphRecord(today);
          graphStore.graphData.push(record);
        }
        record[currOj]++;
      }
      snapshot.solvedDate = value ? today : null;
      window.api.send(Channels.setCurrSnapshotSolvedDate, snapshot.solvedDate);
    },
    updateOjFilters() {
      const oj = this.currProfile!.currOj;
      window.api.send(Channels.updateOjFilters, oj, toRaw(this.currProfile!.ojContext[oj].filters));
    },
    setCurrOjSnapshot(snapshot: OjProblem[Oj]) {
      const currOj = this.currProfile!.currOj;
      const ojContext = this.currProfile!.ojContext[currOj];
      ojContext.snapshot = snapshot;
      window.api.send(Channels.setCurrOjSnapshot, toRaw(snapshot));
    },
    async renameCurrProfile(newName: string) {
      const result = await window.api.invoke<GenericResponseDTO>(
        Channels.renameCurrProfile,
        newName
      );
      if (result.status === 'success') {
        this.currProfile!.name = newName;
        const record = this.registry.profileRecords.find((p) => p.id === this.currProfile!.id);
        record!.name = newName;
      }
      return result;
    },
  },
});
