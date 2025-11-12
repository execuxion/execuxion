<template>
  <div class="mx-auto max-w-xl py-16">
    <!-- Header -->
    <div class="mb-8 text-center">
      <v-remixicon name="riKey2Line" size="48" class="mx-auto mb-4 text-accent" />
      <h1 class="text-3xl font-semibold">
        {{ t('auth.signIn') }}
      </h1>
      <p class="mt-2 text-gray-600 dark:text-gray-200">
        {{ t('auth.signInDescription') }}
      </p>
    </div>

    <!-- Error Alert -->
    <ui-card v-if="error" padding="p-4" class="mb-8">
      <div class="flex items-start">
        <v-remixicon name="riAlertLine" class="mr-2 text-red-600 dark:text-red-400" />
        <p class="text-sm text-red-600 dark:text-red-400">
          {{ error }}
        </p>
      </div>
    </ui-card>

    <!-- Login Form -->
    <form @submit.prevent="handleLogin">
      <div class="mb-8">
        <p class="mb-1 font-semibold">API Key</p>
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
        <p class="ml-1 mt-1 text-sm text-gray-600 dark:text-gray-200">
          {{ t('auth.noApiKey') }}
          <a
            href="https://api.execuxion.com/dashboard"
            target="_blank"
            rel="noopener"
            class="text-accent hover:underline"
          >
            {{ t('auth.getDashboard') }}
          </a>
        </p>
      </div>

      <ui-button
        type="submit"
        :loading="loading"
        :disabled="!apiKey || loading"
        variant="accent"
        class="w-full"
      >
        {{ t('auth.signIn') }}
      </ui-button>
    </form>

    <!-- Additional Info -->
    <div class="mt-8 space-y-3">
      <ui-card padding="p-4" class="flex items-start">
        <v-remixicon name="riShieldCheckLine" class="mr-2 flex-shrink-0 text-accent" size="20" />
        <span class="text-sm text-gray-600 dark:text-gray-200">
          {{ t('auth.secureStorage') }}
        </span>
      </ui-card>

      <ui-card padding="p-4" class="flex items-start">
        <v-remixicon name="riGoogleLine" class="mr-2 flex-shrink-0 text-accent" size="20" />
        <span class="text-sm text-gray-600 dark:text-gray-200">
          {{ t('auth.googleOAuthAvailable') }}
          <a
            href="https://api.execuxion.com/auth/google"
            target="_blank"
            rel="noopener"
            class="text-accent hover:underline"
          >
            {{ t('auth.webDashboard') }}
          </a>
        </span>
      </ui-card>
    </div>
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
</script>
