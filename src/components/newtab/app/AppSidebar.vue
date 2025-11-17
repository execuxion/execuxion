<template>
  <aside
    :class="[
      'fixed left-0 z-50 flex w-16 flex-col items-center bg-white py-6 dark:bg-gray-800',
      isElectron ? 'top-8 h-[calc(100vh-2rem)]' : 'top-0 h-screen'
    ]"
  >
    <img
      :title="`v${extensionVersion}`"
      src="@/assets/svg/logo.svg"
      class="mx-auto mb-4 w-10"
    />
    <div
      class="relative w-full space-y-2 text-center"
      @mouseleave="showHoverIndicator = false"
    >
      <div
        v-show="showHoverIndicator"
        ref="hoverIndicator"
        class="bg-box-transparent absolute left-1/2 h-10 w-10 rounded-lg transition-transform duration-200"
        style="transform: translate(-50%, 0)"
      ></div>
      <router-link
        v-for="tab in tabs"
        v-slot="{ href, navigate, isActive }"
        :key="tab.id"
        :to="tab.path"
        custom
      >
        <a
          v-tooltip:right.group="
            `${t(`common.${tab.id}`, 2)} ${
              tab.shortcut && `(${tab.shortcut.readable})`
            }`
          "
          :class="{ 'is-active': isActive }"
          :href="tab.id === 'log' ? '#' : href"
          class="tab relative z-10 flex w-full items-center justify-center"
          @click="navigateLink($event, navigate, tab)"
          @mouseenter="hoverHandler"
        >
          <div class="inline-block rounded-lg p-2 transition-colors">
            <v-remixicon :name="tab.icon" />
          </div>
          <span
            v-if="tab.id === 'log' && runningWorkflowsLen > 0"
            class="absolute -top-1 right-2 h-4 w-4 rounded-full bg-accent text-xs text-white dark:text-black"
          >
            {{ runningWorkflowsLen }}
          </span>
        </a>
      </router-link>
    </div>
    <!-- Element selector - removed -->
    <!-- <hr class="my-4 w-8/12" />
    <button
      v-tooltip:right.group="$t('home.elementSelector.name')"
      class="focus:ring-0"
      @click="injectElementSelector"
    >
      <v-remixicon name="riFocus3Line" />
    </button> -->
    <div class="grow"></div>

    <!-- Execuxion API User Avatar -->
    <ui-popover
      v-if="mainStore.auth.isAuthenticated && !userStore.user"
      trigger="mouseenter click"
      placement="right"
      class="mt-4"
    >
      <template #trigger>
        <span class="bg-box-transparent inline-block rounded-full p-1 cursor-pointer relative">
          <div v-html="identiconSvg" class="w-8 h-8 rounded-full overflow-hidden"></div>
          <!-- Connected indicator dot -->
          <span class="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></span>
        </span>
      </template>
      <div class="w-56">
        <div class="mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
                Execuxion API
              </p>
              <span class="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                <span class="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                Connected
              </span>
            </div>
            <button
              @click.stop="refreshUserInfo"
              :disabled="isRefreshing"
              class="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              :class="{ 'animate-spin': isRefreshing }"
              title="Refresh account info"
            >
              <v-remixicon name="riRefreshLine" class="text-gray-500 dark:text-gray-400" size="16" />
            </button>
          </div>
        </div>
        <div class="space-y-2 text-sm">
          <div class="flex items-center justify-between">
            <span class="text-gray-600 dark:text-gray-400">Mode:</span>
            <span
              :class="mainStore.auth.user?.mode === 'monthly' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'"
              class="px-2 py-0.5 rounded text-xs font-medium capitalize"
            >
              {{ mainStore.auth.user?.mode || 'N/A' }}
            </span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-gray-600 dark:text-gray-400">Credits:</span>
            <span class="font-semibold text-gray-900 dark:text-gray-100">
              {{ mainStore.auth.user?.credits?.toLocaleString() || '0' }}
            </span>
          </div>
          <div v-if="mainStore.auth.user?.disabled" class="flex items-center justify-between">
            <span class="text-gray-600 dark:text-gray-400">Status:</span>
            <span class="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
              Disabled
            </span>
          </div>
        </div>
      </div>
    </ui-popover>

    <!-- Automa User Avatar (Original) -->
    <ui-popover
      v-if="userStore.user"
      trigger="mouseenter click"
      placement="right"
      class="mt-4"
    >
      <template #trigger>
        <span class="bg-box-transparent inline-block rounded-full p-1">
          <img
            :src="userStore.user.avatar_url"
            height="32"
            width="32"
            class="rounded-full"
          />
        </span>
      </template>
      <div class="w-44">
        <div class="flex items-center">
          <p class="text-overflow flex-1">
            {{ userStore.user.username }}
          </p>
          <span
            title="Subscription"
            :class="subColors[userStore.user.subscription]"
            class="rounded-md px-2 py-1 text-sm capitalize"
          >
            {{ userStore.user.subscription }}
          </span>
        </div>
      </div>
    </ui-popover>
    <ui-popover trigger="mouseenter" placement="right" class="mt-4">
      <template #trigger>
        <v-remixicon name="riGroupLine" />
      </template>
      <p class="mb-2">{{ t('home.communities') }}</p>
      <ui-list class="w-40">
        <ui-list-item
          v-for="item in communities"
          :key="item.name"
          :href="item.url"
          small
          tag="a"
          target="_blank"
          rel="noopener"
        >
          <v-remixicon :name="item.icon" class="mr-2" />
          {{ item.name }}
        </ui-list-item>
      </ui-list>
    </ui-popover>
    <router-link v-tooltip:right.group="t('settings.menu.about')" to="/about" class="mt-4 block">
      <v-remixicon class="cursor-pointer" name="riInformationLine" />
    </router-link>
    <button
      v-tooltip:right.group="t('auth.logout')"
      class="mt-4 block text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-500"
      @click="handleLogout"
    >
      <v-remixicon class="cursor-pointer" name="riLogoutCircleRLine" />
    </button>
  </aside>
</template>
<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';
import browser from 'webextension-polyfill';
import { useUserStore } from '@/stores/user';
import { useWorkflowStore } from '@/stores/workflow';
import { useShortcut, getShortcut } from '@/composable/shortcut';
import { useGroupTooltip } from '@/composable/groupTooltip';
import { communities } from '@/utils/shared';
import { initElementSelector } from '@/newtab/utils/elementSelector';
import emitter from '@/lib/mitt';
import AuthService from '@/service/AuthService';
import { useStore } from '@/stores/main';
import { minidenticon } from 'minidenticons';

useGroupTooltip();

const isElectron = computed(() => window.electron?.isElectron || false);

const { t } = useI18n();
const toast = useToast();
const router = useRouter();
const userStore = useUserStore();
const workflowStore = useWorkflowStore();
const mainStore = useStore();

const extensionVersion = browser.runtime.getManifest().version;
const subColors = {
  free: 'bg-box-transparent',
  pro: 'bg-accent text-white',
  business: 'bg-accent text-white dark:text-black',
};
const tabs = [
  // Dashboard tab - commented out, feature disabled
  // {
  //   id: 'dashboard',
  //   icon: 'riDashboardLine',
  //   path: '/dashboard',
  //   shortcut: getShortcut('page:dashboard', '/dashboard'),
  // },
  {
    id: 'workflow',
    icon: 'riFlowChart',
    path: '/workflows',
    shortcut: getShortcut('page:workflows', '/workflows'),
  },
  {
    id: 'packages',
    icon: 'mdiPackageVariantClosed',
    path: '/packages',
    shortcut: '',
  },
  {
    id: 'schedule',
    icon: 'riTimeLine',
    path: '/schedule',
    shortcut: getShortcut('page:schedule', '/triggers'),
  },
  {
    id: 'storage',
    icon: 'riHardDrive2Line',
    path: '/storage',
    shortcut: getShortcut('page:storage', '/storage'),
  },
  {
    id: 'log',
    icon: 'riHistoryLine',
    path: '/logs',
    shortcut: getShortcut('page:logs', '/logs'),
  },
  {
    id: 'settings',
    icon: 'riSettings3Line',
    path: '/settings',
    shortcut: getShortcut('page:settings', '/settings'),
  },
];
const hoverIndicator = ref(null);
const showHoverIndicator = ref(false);
const runningWorkflowsLen = computed(() => workflowStore.getAllStates.length);
const isRefreshing = ref(false);

// Execuxion API user computed properties
const clientIdFromApiKey = computed(() => {
  if (!mainStore.auth.apiKey) return '';
  // Extract clientId from ex_<uuid>_<suffix> OR ex_<uuid> format (suffix is optional)
  const match = mainStore.auth.apiKey.match(/^ex_([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})(?:_|$)/i);
  return match ? match[1] : '';
});

const identiconSvg = computed(() => {
  const id = clientIdFromApiKey.value;
  if (!id) return '';
  // Generate identicon with default saturation and lightness for colorful output
  // The function returns the SVG content (paths/rects) that go inside an SVG element
  return minidenticon(id);
});

async function refreshUserInfo() {
  if (isRefreshing.value) return;

  try {
    isRefreshing.value = true;

    // Call the refresh method from AuthService
    const success = await AuthService.refreshUserData();

    if (success) {
      // Update mainStore with fresh data
      mainStore.setAuth({
        isAuthenticated: true,
        user: AuthService.user,
        apiKey: AuthService.apiKey,
      });
      toast.success('Account info refreshed');
    } else {
      toast.error('Failed to refresh account info');
    }
  } catch (error) {
    console.error('Refresh error:', error);
    toast.error('Failed to refresh account info');
  } finally {
    isRefreshing.value = false;
  }
}

useShortcut(
  tabs.reduce((acc, { shortcut }) => {
    if (shortcut) {
      acc.push(shortcut);
    }

    return acc;
  }, []),
  ({ data }) => {
    if (!data) return;

    if (data.includes('/logs')) {
      emitter.emit('ui:logs', { show: true });
      return;
    }

    router.push(data);
  }
);

function navigateLink(event, navigateFn, tab) {
  event.preventDefault();

  if (tab.id === 'log') {
    emitter.emit('ui:logs', { show: true });
  } else {
    navigateFn();
  }
}
function hoverHandler({ target }) {
  showHoverIndicator.value = true;
  hoverIndicator.value.style.transform = `translate(-50%, ${target.offsetTop}px)`;
}
async function injectElementSelector() {
  try {
    const [tab] = await browser.tabs.query({ active: true, url: '*://*/*' });
    if (!tab) {
      toast.error(t('home.elementSelector.noAccess'));
      return;
    }

    await initElementSelector();
  } catch (error) {
    console.error(error);
  }
}

async function handleLogout() {
  try {
    await AuthService.logout();
    mainStore.clearAuth();
    toast.success(t('auth.logoutSuccess'));
    router.push('/login');
  } catch (error) {
    console.error('Logout error:', error);
    toast.error(t('auth.errors.unexpected'));
  }
}
</script>
<style scoped>
.tab.is-active:after {
  content: '';
  position: absolute;
  right: 0;
  top: 0;
  height: 100%;
  width: 4px;
  @apply bg-accent dark:bg-gray-100;
}
</style>
