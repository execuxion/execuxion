import { createRouter, createWebHistory } from 'vue-router';
import Welcome from './pages/Welcome.vue';
import Login from './pages/Login.vue';
// import Dashboard from './pages/Dashboard.vue'; // Commented out - dashboard feature disabled
import Packages from './pages/Packages.vue';
import Workflows from './pages/workflows/index.vue';
import SimpleTest from './pages/SimpleTest.vue';
import WorkflowContainer from './pages/Workflows.vue';
import WorkflowHost from './pages/workflows/Host.vue';
import WorkflowDetails from './pages/workflows/[id].vue';
import WorkflowShared from './pages/workflows/Shared.vue';
import ScheduledWorkflow from './pages/ScheduledWorkflow.vue';
import Storage from './pages/Storage.vue';
import StorageTables from './pages/storage/Tables.vue';
import LogsDetails from './pages/logs/[id].vue';
import Recording from './pages/Recording.vue';
import Settings from './pages/Settings.vue';
import SettingsIndex from './pages/settings/SettingsIndex.vue';
import SettingsAbout from './pages/settings/SettingsAbout.vue';
import SettingsShortcuts from './pages/settings/SettingsShortcuts.vue';
import SettingsBackup from './pages/settings/SettingsBackup.vue';
import SettingsEditor from './pages/settings/SettingsEditor.vue';
import AuthService from '@/service/AuthService';

const routes = [
  {
    name: 'login',
    path: '/login',
    component: Login,
    meta: { requiresAuth: false }
  },
  {
    name: 'home',
    path: '/',
    redirect: '/workflows',
    component: Workflows,
    meta: { requiresAuth: true }
  },
  // Dashboard route - commented out, feature disabled
  // {
  //   name: 'dashboard',
  //   path: '/dashboard',
  //   component: Dashboard,
  //   meta: { requiresAuth: true }
  // },
  {
    name: 'welcome',
    path: '/welcome',
    component: Welcome,
    meta: { requiresAuth: true }
  },
  {
    name: 'packages',
    path: '/packages',
    component: Packages,
    meta: { requiresAuth: true }
  },
  {
    name: 'recording',
    path: '/recording',
    component: Recording,
  },
  {
    name: 'packages-details',
    path: '/packages/:id',
    component: WorkflowDetails,
  },
  {
    path: '/workflows',
    component: WorkflowContainer,
    children: [
      {
        path: '',
        name: 'workflows',
        component: Workflows,
      },
      {
        path: ':id',
        name: 'workflows-details',
        component: WorkflowDetails,
      },
      {
        name: 'team-workflows',
        path: '/teams/:teamId/workflows/:id',
        component: WorkflowDetails,
      },
      {
        name: 'workflow-host',
        path: '/workflows/:id/host',
        component: WorkflowHost,
      },
      {
        name: 'workflow-shared',
        path: '/workflows/:id/shared',
        component: WorkflowShared,
      },
    ],
  },
  {
    name: 'schedule',
    path: '/schedule',
    component: ScheduledWorkflow,
  },
  {
    name: 'storage',
    path: '/storage',
    component: Storage,
  },
  {
    name: 'storage-tables',
    path: '/storage/tables/:id',
    component: StorageTables,
  },
  {
    name: 'logs-details',
    path: '/logs/:id?',
    component: LogsDetails,
  },
  {
    path: '/settings',
    component: Settings,
    children: [
      { path: '', component: SettingsIndex },
      { path: 'about', component: SettingsAbout },
      { path: 'backup', component: SettingsBackup },
      { path: 'editor', component: SettingsEditor },
      { path: 'shortcuts', component: SettingsShortcuts },
    ],
  },
];

const router = createRouter({
  routes,
  history: createWebHistory(),
});

// Navigation guard for authentication
router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.meta.requiresAuth !== false; // Default to requiring auth

  // Initialize auth service if not already done
  if (!AuthService.isAuthenticated) {
    await AuthService.init();

    // Sync auth state to mainStore
    if (AuthService.isAuthenticated) {
      const { useStore } = await import('@/stores/main');
      const mainStore = useStore();
      mainStore.setAuth({
        isAuthenticated: true,
        user: AuthService.user,
        apiKey: AuthService.apiKey,
      });
    }
  }

  if (requiresAuth && !AuthService.isLoggedIn()) {
    // Redirect to login if not authenticated
    next('/login');
  } else if (to.path === '/login' && AuthService.isLoggedIn()) {
    // Redirect to home if already logged in
    next('/');
  } else {
    next();
  }
});

export default router;
