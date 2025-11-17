<template>
  <div class="flex h-full w-full items-center justify-center">
    <ui-card class="w-full max-w-md" padding="p-10">
      <!-- Header -->
      <div class="mb-8 text-center">
        <v-remixicon name="riKey2Line" size="48" class="mx-auto mb-4 text-accent" />
        <h1 class="text-2xl font-semibold">
          API Configuration
        </h1>
        <p class="mt-2 text-base text-gray-600 dark:text-gray-200">
          Enter your API key to get started
        </p>
      </div>

      <!-- Error Alert -->
      <div v-if="error" class="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 p-3">
        <div class="flex items-start">
          <v-remixicon name="riAlertLine" class="mr-2 text-red-600 dark:text-red-400" size="18" />
          <p class="text-sm text-red-600 dark:text-red-400">
            {{ error }}
          </p>
        </div>
      </div>

      <!-- Login Form -->
      <form @submit.prevent="handleLogin" class="space-y-6">
        <div>
          <label class="mb-2 block text-base font-medium">API Key</label>
          <ui-input
            v-model="apiKey"
            type="text"
            placeholder="ex_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx_xxxxxx"
            prepend-icon="riKeyLine"
            :disabled="loading"
            class="w-full"
            required
            autofocus
          />
          <p class="ml-0.5 mt-2 text-sm text-gray-600 dark:text-gray-200">
            {{ t('auth.noApiKey') }}
            <a
              href="https://api.execuxion.com/dashboard"
              target="_blank"
              rel="noopener"
              class="text-accent underline hover:no-underline font-medium"
            >
              {{ t('auth.getDashboard') }}
            </a>
          </p>
        </div>

        <div class="space-y-3 pt-1">
          <ui-button
            type="submit"
            :loading="loading"
            :disabled="!apiKey || loading"
            variant="accent"
            class="w-full"
          >
            Continue
          </ui-button>

          <ui-button
            @click="openDashboard"
            type="button"
            class="w-full flex items-center justify-center gap-2"
          >
            <v-remixicon name="riExternalLinkLine" size="18" />
            <span>Open Web Dashboard</span>
          </ui-button>
        </div>
      </form>
    </ui-card>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useToast } from 'vue-toastification';
import AuthService from '@/service/AuthService';
import { useStore } from '@/stores/main';

const { t } = useI18n();
const router = useRouter();
const toast = useToast();
const mainStore = useStore();

const apiKey = ref('');
const loading = ref(false);
const error = ref('');

async function handleLogin() {
  if (!apiKey.value) {
    error.value = t('auth.errors.emptyApiKey');
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    const result = await AuthService.login(apiKey.value.trim());

    if (result.success) {
      toast.success(t('auth.loginSuccess', { name: result.user.name || 'User' }));

      // Update auth state in store
      mainStore.setAuth({
        isAuthenticated: true,
        user: result.user,
        apiKey: apiKey.value.trim()
      });

      // Redirect to home/workflows page
      setTimeout(() => {
        router.push('/');
      }, 500);
    } else {
      error.value = result.error || t('auth.errors.invalidApiKey');
    }
  } catch (err) {
    error.value = err.message || t('auth.errors.unexpected');
    console.error('Login error:', err);
  } finally {
    loading.value = false;
  }
}

function openDashboard() {
  const dashboardUrl = 'https://api.execuxion.com/dashboard';

  // Check if we're in Electron
  if (window.electron?.isElectron) {
    // Use Electron's shell to open in default browser
    window.electron.openExternal(dashboardUrl);
  } else {
    // Fallback for web version
    window.open(dashboardUrl, '_blank', 'noopener,noreferrer');
  }
}
</script>
