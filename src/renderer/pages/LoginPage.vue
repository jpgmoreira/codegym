<script lang="ts" setup>
  import { ref, computed } from 'vue';
  import { useRouter } from 'vue-router';
  import { useProfileStore } from '@renderer/store/profile';
  import { parseTimestamp } from '@common/utils/dateUtils';
  import Header from '@renderer/components/Header/Header.vue';
  import HeaderButton from '@renderer/components/Header/HeaderButton.vue';
  import BusyButton from '@renderer/components/UI/BusyButton.vue';
  const store = useProfileStore();
  const router = useRouter();
  const fetching = ref<string | null>(null);
  const isBusy = ref(false);
  const profiles = computed(() => store.registry.profileRecords);
  async function onClick(profileId: string) {
    fetching.value = profileId;
    await store.login(profileId);
    document.title = `${store.currProfile!.name}@codegym`;
    router.replace(store.currProfile!.page);
  }
</script>

<template>
  <div class="flex flex-col h-[100vh]">
    <Header>
      <HeaderButton to="/login">Login</HeaderButton>
      <HeaderButton to="/signup">Create Profile</HeaderButton>
    </Header>
    <div class="overflow-y-auto">
      <table class="w-full table-fixed">
        <thead class="sticky top-0">
          <tr>
            <th class="w-1/4">#</th>
            <th class="w-1/4">Profile</th>
            <th class="w-1/4">Created at</th>
            <th class="w-1/4"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(profile, index) in profiles" :key="profile.id">
            <td>{{ index + 1 }}</td>
            <td class="font-bold">{{ profile.name }}</td>
            <td class="whitespace-nowrap">{{ parseTimestamp(profile.createdAt) }}</td>
            <td class="flex justify-center">
              <BusyButton
                class="btn-primary flex items-center"
                :busy-signal="fetching === profile.id"
                @click="onClick(profile.id)"
                v-model="isBusy"
              >
                Login
                <span v-if="fetching === profile.id && isBusy" class="ml-1 loader"></span>
              </BusyButton>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
