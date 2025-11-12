<template>
  <div class="container pt-8 pb-4">
    <!-- Header -->
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold">Dashboard</h1>
        <p class="mt-1 text-gray-600 dark:text-gray-400">
          {{ t('dashboard.subtitle') || 'Monitor your account usage and credits' }}
        </p>
      </div>
      <ui-button
        variant="accent"
        @click="refreshDashboard"
        :loading="state.loading"
      >
        <v-remixicon name="riRefreshLine" class="mr-2" />
        {{ t('common.refresh') || 'Refresh' }}
      </ui-button>
    </div>

    <!-- Loading State -->
    <div v-if="state.loading && !state.dashboardData" class="flex items-center justify-center py-16">
      <div class="text-center">
        <ui-spinner size="48" class="mb-4" />
        <p class="text-gray-600 dark:text-gray-400">Loading dashboard data...</p>
      </div>
    </div>

    <!-- Error State -->
    <ui-card v-else-if="state.error" padding="p-6" class="border-l-4 border-red-500">
      <div class="flex items-start">
        <v-remixicon name="riErrorWarningLine" class="mr-3 text-2xl text-red-600" />
        <div>
          <h3 class="font-semibold text-red-600">{{ state.error.includes('login') ? 'Authentication Required' : 'Error Loading Dashboard' }}</h3>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">{{ state.error }}</p>
          <div class="mt-3 flex gap-2">
            <ui-button
              v-if="state.error.includes('login')"
              variant="accent"
              @click="$router.push('/login')"
            >
              Go to Login
            </ui-button>
            <ui-button
              v-else
              variant="danger"
              @click="refreshDashboard"
            >
              Try Again
            </ui-button>
          </div>
        </div>
      </div>
    </ui-card>

    <!-- Dashboard Content -->
    <div v-else-if="state.dashboardData && state.dashboardData.client">
      <!-- Stats Cards -->
      <div class="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <!-- Credits Card -->
        <ui-card padding="p-6" hover class="border-l-4 border-blue-500">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                {{ state.dashboardData.client.mode === 'metered' ? 'Credits Remaining' : 'Account Type' }}
              </p>
              <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {{ state.dashboardData.client.mode === 'metered'
                  ? state.dashboardData.client.credits.toLocaleString()
                  : 'Unlimited' }}
              </p>
              <p class="mt-1 text-xs text-gray-500">
                {{ state.dashboardData.client.mode === 'metered' ? 'API Credits' : 'Monthly Plan' }}
              </p>
            </div>
            <div class="rounded-lg bg-blue-100 p-3 dark:bg-blue-900">
              <v-remixicon name="riCoinLine" class="text-2xl text-blue-600 dark:text-blue-300" />
            </div>
          </div>
        </ui-card>

        <!-- Total API Calls Card -->
        <ui-card padding="p-6" hover class="border-l-4 border-green-500">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total API Calls</p>
              <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {{ state.dashboardData.totalCalls.toLocaleString() }}
              </p>
              <p class="mt-1 text-xs text-gray-500">
                Last {{ getTimeRangeLabel() }}
              </p>
            </div>
            <div class="rounded-lg bg-green-100 p-3 dark:bg-green-900">
              <v-remixicon name="riBarChartBoxLine" class="text-2xl text-green-600 dark:text-green-300" />
            </div>
          </div>
        </ui-card>

        <!-- Account Status Card -->
        <ui-card padding="p-6" hover class="border-l-4 border-purple-500">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Account Status</p>
              <p class="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                {{ state.dashboardData.client.flags?.disabled ? 'Disabled' : 'Active' }}
              </p>
              <p class="mt-1 text-xs text-gray-500">
                {{ state.dashboardData.client.email || 'No email' }}
              </p>
            </div>
            <div class="rounded-lg bg-purple-100 p-3 dark:bg-purple-900">
              <v-remixicon
                :name="state.dashboardData.client.flags?.disabled ? 'riUserUnfollowLine' : 'riUserFollowLine'"
                class="text-2xl text-purple-600 dark:text-purple-300"
              />
            </div>
          </div>
        </ui-card>

        <!-- Last Activity Card -->
        <ui-card padding="p-6" hover class="border-l-4 border-orange-500">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Last Activity</p>
              <p class="mt-2 text-xl font-bold text-gray-900 dark:text-white">
                {{ formatLastActivity(state.dashboardData.client.lastUse) }}
              </p>
              <p class="mt-1 text-xs text-gray-500">
                {{ formatDateTime(state.dashboardData.client.lastUse) }}
              </p>
            </div>
            <div class="rounded-lg bg-orange-100 p-3 dark:bg-orange-900">
              <v-remixicon name="riTimeLine" class="text-2xl text-orange-600 dark:text-orange-300" />
            </div>
          </div>
        </ui-card>
      </div>

      <!-- Time Range Filter -->
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-xl font-semibold">Recent Usage</h2>
        <ui-select
          v-model="state.timeRange"
          placeholder="Time Range"
          class="w-40"
          @change="changeTimeRange"
        >
          <option value="1h">Last Hour</option>
          <option value="12h">Last 12 Hours</option>
          <option value="24h">Last 24 Hours</option>
          <option value="3d">Last 3 Days</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </ui-select>
      </div>

      <!-- Recent Usage Table -->
      <ui-card padding="p-0">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="border-b bg-gray-50 dark:bg-gray-800">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Operation
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Status
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Credits
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Time
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Request ID
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr
                v-for="usage in state.dashboardData.recentUsage"
                :key="usage.id"
                class="transition hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <td class="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                  {{ usage.operation }}
                </td>
                <td class="px-6 py-4 text-sm">
                  <span
                    class="inline-flex rounded-full px-2 py-1 text-xs font-semibold leading-5"
                    :class="getStatusClass(usage.status)"
                  >
                    {{ usage.status }}
                  </span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                  {{ usage.credits_used || 0 }}
                </td>
                <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                  {{ formatDateTime(usage.timestamp) }}
                </td>
                <td class="px-6 py-4 font-mono text-xs text-gray-500">
                  {{ usage.request_id ? usage.request_id.substring(0, 8) : 'N/A' }}
                </td>
              </tr>
              <tr v-if="!state.dashboardData.recentUsage.length">
                <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                  <v-remixicon name="riInboxLine" class="mx-auto mb-2 text-4xl" />
                  <p>No usage data for the selected time range</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="state.dashboardData.recentUsage.length > 0" class="border-t px-6 py-4">
          <div class="flex items-center justify-between">
            <p class="text-sm text-gray-700 dark:text-gray-300">
              {{ state.dashboardData.pagination?.showing || `Showing ${state.offset + 1} to ${Math.min(state.offset + state.limit, state.dashboardData.totalCalls)} of ${state.dashboardData.totalCalls} results` }}
            </p>
            <div class="flex gap-2">
              <ui-button
                :disabled="state.offset === 0"
                @click="previousPage"
              >
                Previous
              </ui-button>
              <ui-button
                :disabled="state.offset + state.limit >= (state.dashboardData.pagination?.total || state.dashboardData.totalCalls)"
                @click="nextPage"
              >
                Next
              </ui-button>
            </div>
          </div>
        </div>
      </ui-card>

      <!-- Account Info -->
      <ui-card padding="p-6" class="mt-6">
        <h3 class="mb-4 text-lg font-semibold">Account Information</h3>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400">Client ID</p>
            <p class="mt-1 font-mono text-sm font-medium">{{ state.dashboardData.client.clientId }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400">Billing Mode</p>
            <p class="mt-1 text-sm font-medium capitalize">{{ state.dashboardData.client.mode }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400">Auth Type</p>
            <p class="mt-1 text-sm font-medium capitalize">{{ state.dashboardData.client.authType || 'API Key' }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400">Created</p>
            <p class="mt-1 text-sm font-medium">{{ formatDateTime(state.dashboardData.client.createdAt) }}</p>
          </div>
        </div>
      </ui-card>
    </div>

    <!-- Fallback for incomplete data -->
    <ui-card v-else padding="p-6" class="border-l-4 border-yellow-500">
      <div class="flex items-start">
        <v-remixicon name="riAlertLine" class="mr-3 text-2xl text-yellow-600" />
        <div>
          <h3 class="font-semibold text-yellow-600">Incomplete Dashboard Data</h3>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
            The dashboard data was loaded but some information is missing. Please try refreshing.
          </p>
          <ui-button
            class="mt-3"
            variant="accent"
            @click="refreshDashboard"
          >
            Refresh Dashboard
          </ui-button>
        </div>
      </div>
    </ui-card>
  </div>
</template>

<script setup>
import { reactive, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'vue-toastification';
import AuthService from '@/service/AuthService';

const { t } = useI18n();
const toast = useToast();

const state = reactive({
  loading: false,
  error: null,
  dashboardData: null,
  timeRange: '3d',
  limit: 50,
  offset: 0,
});

async function loadDashboardData() {
  // Check if user is logged in first
  if (!AuthService.isLoggedIn()) {
    state.error = 'Please login to view your dashboard';
    state.loading = false;
    return;
  }

  state.loading = true;
  state.error = null;

  try {
    const response = await AuthService.makeApiRequest('client.get_dashboard_data', {
      timeRange: state.timeRange,
      limit: state.limit,
      offset: state.offset,
    });

    if (response.ok) {
      console.log('✅ Dashboard data loaded:', response.data);

      // Validate data structure
      if (!response.data || !response.data.clientInfo) {
        console.error('❌ Invalid dashboard data structure:', response.data);
        throw new Error('Invalid dashboard data received from API');
      }

      // Extract clientId from API key (format: ex_<uuid> or ex_<uuid>_<suffix>)
      const apiKey = AuthService.getApiKey() || '';
      const clientIdMatch = apiKey.match(/^ex_([0-9a-f-]{36})/);
      const clientId = clientIdMatch ? clientIdMatch[1] : (AuthService.getUser()?.clientId || 'Unknown');

      // Transform API response to match dashboard structure
      const transformed = {
        client: {
          clientId: clientId,
          email: AuthService.getUser()?.email || null,
          mode: response.data.clientInfo.mode?.toLowerCase() || 'metered',
          credits: response.data.clientInfo.credits || 0,
          lastUse: response.data.clientInfo.lastUse || null,
          authType: 'API Key',
          createdAt: AuthService.getUser()?.createdAt || null,
          flags: AuthService.getUser()?.flags || {}
        },
        recentUsage: (response.data.recentActivity?.usage || []).map(item => ({
          ...item,
          status: item.status || 'completed' // Default to completed if no status
        })),
        totalCalls: response.data.counts?.totalCalls3d || 0,
        pagination: response.data.recentActivity?.pagination || {}
      };

      state.dashboardData = transformed;
    } else {
      console.error('❌ API error response:', response);
      throw new Error(response.error?.message || 'Failed to load dashboard data');
    }
  } catch (error) {
    console.error('Dashboard error:', error);
    state.error = error.message;
    toast.error('Failed to load dashboard data');
  } finally {
    state.loading = false;
  }
}

function refreshDashboard() {
  state.offset = 0;
  loadDashboardData();
}

function changeTimeRange() {
  state.offset = 0;
  loadDashboardData();
}

function nextPage() {
  state.offset += state.limit;
  loadDashboardData();
}

function previousPage() {
  state.offset = Math.max(0, state.offset - state.limit);
  loadDashboardData();
}

function formatDateTime(timestamp) {
  if (!timestamp) return 'Never';
  // Handle both string and number timestamps
  const ts = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp;
  const date = new Date(ts);

  // Check if date is valid
  if (isNaN(date.getTime())) return 'Invalid Date';

  return date.toLocaleString();
}

function formatLastActivity(timestamp) {
  if (!timestamp) return 'Never';
  // Handle both string and number timestamps
  const ts = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp;
  const now = Date.now();
  const diff = now - ts;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function getStatusClass(status) {
  const classes = {
    completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    reserved: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    refunded: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    failed: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  };
  return classes[status] || classes.failed;
}

function getTimeRangeLabel() {
  const labels = {
    '1h': 'Hour',
    '12h': '12 Hours',
    '24h': '24 Hours',
    '3d': '3 Days',
    '7d': '7 Days',
    '30d': '30 Days',
  };
  return labels[state.timeRange] || '3 Days';
}

onMounted(() => {
  loadDashboardData();
});
</script>
