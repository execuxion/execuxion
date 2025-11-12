<template>
  <template v-if="retrieved">
    <!-- Custom title bar for Electron -->
    <app-title-bar v-if="isElectron && $route.name !== 'recording' && $route.name !== 'login'" />
    <app-sidebar v-if="$route.name !== 'recording' && $route.name !== 'login'" />
    <main :class="{
      'pl-16': $route.name !== 'recording' && $route.name !== 'login',
      'pt-8 h-[calc(100vh-2rem)]': isElectron && $route.name !== 'recording' && $route.name !== 'login',
      'h-screen': !isElectron || $route.name === 'recording' || $route.name === 'login'
    }">
      <router-view />
    </main>
    <app-logs />
    <ui-dialog>
      <template #auth>
        <div class="text-center">
          <p class="text-xl font-semibold">Oops!! 😬</p>
          <p class="mt-2 text-gray-600 dark:text-gray-200">
            {{ t('auth.text') }}
          </p>
          <ui-button
            @click="$router.push('/login')"
            class="mt-6 block w-full"
            variant="accent"
          >
            {{ t('auth.signIn') }}
          </ui-button>
        </div>
      </template>
    </ui-dialog>
    <div
      v-if="isUpdated"
      class="fixed bottom-8 left-1/2 z-50 max-w-xl -translate-x-1/2 text-white dark:text-gray-900"
    >
      <div class="flex items-center rounded-lg bg-accent p-4 shadow-2xl">
        <v-remixicon name="riInformationLine" class="mr-3" />
        <p>
          {{ t('updateMessage.text1', { version: currentVersion }) }}
        </p>
        <a
          :href="`https://github.com/execuxion/execuxion/releases/latest`"
          target="_blank"
          rel="noopener"
          class="ml-1 underline"
        >
          {{ t('updateMessage.text2') }}
        </a>
        <div class="flex-1" />
        <button
          class="ml-6 text-gray-200 dark:text-gray-600"
          @click="isUpdated = false"
        >
          <v-remixicon size="20" name="riCloseLine" />
        </button>
      </div>
    </div>
    <shared-permissions-modal
      v-model="permissionState.showModal"
      :permissions="permissionState.items"
    />
  </template>
  <div v-else class="py-8 text-center">
    <ui-spinner color="text-accent" size="28" />
  </div>
</template>
<script setup>
import iconChrome from '@/assets/svg/logo.svg';
import iconFirefox from '@/assets/svg/logoFirefox.svg';
import AppLogs from '@/components/newtab/app/AppLogs.vue';
import AppSidebar from '@/components/newtab/app/AppSidebar.vue';
import AppTitleBar from '@/components/newtab/app/AppTitleBar.vue';
import SharedPermissionsModal from '@/components/newtab/shared/SharedPermissionsModal.vue';
import { useTheme } from '@/composable/theme';
import dbLogs from '@/db/logs';
import dayjs from '@/lib/dayjs';
import emitter from '@/lib/mitt';
import { loadLocaleMessages, setI18nLanguage } from '@/lib/vueI18n';
import { useFolderStore } from '@/stores/folder';
import { useHostedWorkflowStore } from '@/stores/hostedWorkflow';
import { useStore } from '@/stores/main';
import { usePackageStore } from '@/stores/package';
import { useSharedWorkflowStore } from '@/stores/sharedWorkflow';
import { useTeamWorkflowStore } from '@/stores/teamWorkflow';
import { useUserStore } from '@/stores/user';
import { useWorkflowStore } from '@/stores/workflow';
import { getUserWorkflows } from '@/utils/api';
import dataMigration from '@/utils/dataMigration';
import { MessageListener } from '@/utils/message';
import { getWorkflowPermissions } from '@/utils/workflowData';
import automa from '@business';
import { useHead } from '@vueuse/head';
import { compare } from 'compare-versions';
import { reactive, ref, watch, computed, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import browser from 'webextension-polyfill';

const iconElement = document.createElement('link');
iconElement.rel = 'icon';
iconElement.href =
  window.location.protocol === 'moz-extension' ? iconFirefox : iconChrome;
document.head.appendChild(iconElement);

window.fromBackground = window.location.href.includes('?fromBackground=true');

const { t } = useI18n();
const route = useRoute();
const store = useStore();
const theme = useTheme();
const router = useRouter();
const userStore = useUserStore();
const folderStore = useFolderStore();
const packageStore = usePackageStore();
const workflowStore = useWorkflowStore();
const teamWorkflowStore = useTeamWorkflowStore();
const sharedWorkflowStore = useSharedWorkflowStore();
const hostedWorkflowStore = useHostedWorkflowStore();

theme.init();

const retrieved = ref(false);
const isUpdated = ref(false);
const isElectron = computed(() => window.electron?.isElectron || false);
const permissionState = reactive({
  permissions: [],
  showModal: false,
});

const currentVersion = browser.runtime.getManifest().version;
const prevVersion = localStorage.getItem('ext-version') || '0.0.0';

async function fetchUserData() {
  try {
    if (!userStore.user) return;

    const { backup, hosted } = await getUserWorkflows();
    userStore.hostedWorkflows = hosted || {};

    if (backup && backup.length > 0) {
      const { lastBackup } = browser.storage.local.get('lastBackup');
      if (!lastBackup) {
        const backupIds = backup.map(({ id }) => id);

        userStore.backupIds = backupIds;
        await browser.storage.local.set({
          backupIds,
          lastBackup: new Date().toISOString(),
        });
      }

      await workflowStore.insertOrUpdate(backup, { checkUpdateDate: true });
    }

    userStore.retrieved = true;
  } catch (error) {
    console.error(error);
  }
}
/* eslint-disable-next-line */
function autoDeleteLogs() {
  const deleteAfter = store.settings.deleteLogAfter;
  if (deleteAfter === 'never') return;

  const lastCheck =
    +localStorage.getItem('checkDeleteLogs') || Date.now() - 8.64e7;
  const dayDiff = dayjs().diff(dayjs(lastCheck), 'day');

  if (dayDiff < 1) return;

  const aDayInMs = 8.64e7;
  const maxLogAge = Date.now() - aDayInMs * deleteAfter;

  dbLogs.items
    .where('endedAt')
    .below(maxLogAge)
    .toArray()
    .then((values) => {
      const ids = values.map(({ id }) => id);

      dbLogs.items.bulkDelete(ids);
      dbLogs.ctxData.where('logId').anyOf(ids).delete();
      dbLogs.logsData.where('logId').anyOf(ids).delete();
      dbLogs.histories.where('logId').anyOf(ids).delete();

      localStorage.setItem('checkDeleteLogs', Date.now());
    });
}
async function syncHostedWorkflows() {
  const hostIds = [];
  const userHosted = userStore.getHostedWorkflows;
  const hostedWorkflows = hostedWorkflowStore.workflows;

  Object.keys(hostedWorkflows).forEach((hostId) => {
    const isItsOwn = userHosted.find((item) => item.hostId === hostId);
    if (isItsOwn) return;

    hostIds.push({ hostId, updatedAt: hostedWorkflows[hostId].updatedAt });
  });

  if (hostIds.length === 0) return;

  await hostedWorkflowStore.fetchWorkflows(hostIds);
}
function stopRecording() {
  if (!window.stopRecording) return;

  window.stopRecording();
}

const messageEvents = {
  'refresh-packages': function () {
    packageStore.loadData(true);
  },
  'open-logs': function (data) {
    emitter.emit('ui:logs', {
      show: true,
      logId: data.logId,
    });
  },
  'workflow:added': function (data) {
    if (data.source === 'team') {
      teamWorkflowStore.loadData().then(() => {
        router.push(
          `/teams/${data.teamId}/workflows/${data.workflowId}?permission=true`
        );
      });
    } else if (data.workflowData) {
      workflowStore
        .insert(data.workflowData, { duplicateId: true })
        .then(async () => {
          try {
            const permissions = await getWorkflowPermissions(data.workflowData);
            if (permissions.length === 0) return;

            permissionState.items = permissions;
            permissionState.showModal = true;
          } catch (error) {
            console.error(error);
          }
        })
        .catch((error) => {
          console.error(error);
        });
    }
  },
  'recording:stop': stopRecording,
  'background--recording:stop': stopRecording,
};

browser.runtime.onMessage.addListener(({ type, data }) => {
  if (!type || !messageEvents[type]) return;

  messageEvents[type](data);
});

browser.storage.local.onChanged.addListener(({ workflowStates }) => {
  if (!workflowStates) return;
  const states = Object.values(workflowStates.newValue);
  workflowStore.states = states;
});

useHead(() => {
  const runningWorkflows = workflowStore.popupStates.length;

  return {
    title: 'Dashboard',
    titleTemplate:
      runningWorkflows > 0
        ? `%s (${runningWorkflows} Workflows Running) - Execuxion`
        : '%s - Execuxion',
  };
});

/* eslint-disable-next-line */
window.onbeforeunload = () => {
  const runningWorkflows = workflowStore.popupStates.length;
  if (window.isDataChanged || runningWorkflows > 0) {
    return t('message.notSaved');
  }
};
window.addEventListener('message', ({ data }) => {
  if (data?.type !== 'automa-fetch') return;

  const sendResponse = (result) => {
    const sandbox = document.getElementById('sandbox');
    sandbox.contentWindow.postMessage(
      {
        type: 'fetchResponse',
        data: result,
        id: data.data.id,
      },
      '*'
    );
  };

  MessageListener.sendMessage('fetch', data.data, 'background')
    .then((result) => {
      sendResponse({ isError: false, result });
    })
    .catch((error) => {
      sendResponse({ isError: true, result: error.message });
    });
});

watch(
  () => workflowStore.popupStates,
  () => {
    if (
      !window.fromBackground ||
      workflowStore.popupStates.length !== 0 ||
      route.name !== 'workflows'
    )
      return;

    window.close();
  }
);

// Global keyboard handler for native app-like behavior
function onGlobalKeydown(event) {
  const { ctrlKey, metaKey, key, target } = event;

  // Check if Ctrl/Cmd+A is pressed
  if ((ctrlKey || metaKey) && key.toLowerCase() === 'a') {
    // Allow default behavior in text input contexts
    const isTextInput =
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.isContentEditable;

    // Allow default behavior inside workflow editor (it has its own handler)
    const isInWorkflowEditor = target.closest('.workflow-editor');

    // If not in text input or workflow editor, prevent default text selection
    if (!isTextInput && !isInWorkflowEditor) {
      event.preventDefault();
    }
  }
}

// Register global keyboard handler
onMounted(() => {
  window.addEventListener('keydown', onGlobalKeydown, true);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onGlobalKeydown, true);
});

// Disabled browser extension tab management for web app
// (async () => {
//   try {
//     const { workflowStates } = await browser.storage.local.get(
//       'workflowStates'
//     );
//     workflowStore.states = Object.values(workflowStates || {});
//     console.log('Workflow states loaded for web app');
//   } catch (error) {
//     console.log('Error loading workflow states (expected in web app):', error);
//   }
// })();

// Initialize stores for web app
(async () => {
  try {
    // Set electron-app class if running in Electron
    if (window.electron?.isElectron) {
      document.documentElement.classList.add('electron-app');
    }

    // Load basic settings
    await Promise.allSettled([
      store.loadSettings(),
      workflowStore.loadData(),
      folderStore.load(),
      packageStore.loadData(),
    ]);

    // Load locale
    await loadLocaleMessages(store.settings.locale || 'en', 'newtab');
    await setI18nLanguage(store.settings.locale || 'en');

    console.log('Execuxion app initialized successfully');

    // Set app as retrieved so UI shows
    retrieved.value = true;
  } catch (error) {
    console.log('Web app initialization complete with warnings:', error);
    // Still show UI even if some initialization fails
    retrieved.value = true;
  }
})();
</script>
<style>
html,
body {
  @apply bg-gray-50 dark:bg-gray-900 text-black dark:text-gray-100;
}

body {
  min-height: 100vh;
}

/* CSS variable for title bar offset in Electron */
:root {
  --titlebar-height: 0px;
}

html.electron-app {
  --titlebar-height: 32px;
}

#app {
  height: 100%;
}

h1,
h2,
h3 {
  @apply dark:text-white;
}
</style>
