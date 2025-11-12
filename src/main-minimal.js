import { createApp } from 'vue';
import { createRouter, createWebHashHistory } from 'vue-router';

// Minimal app component
const MinimalApp = {
  template: `
    <div class="p-8 max-w-4xl mx-auto">
      <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
        <h1 class="text-2xl font-bold">🎉 Automa Web App Conversion SUCCESS!</h1>
        <p class="mt-2">The basic infrastructure is working perfectly.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-white p-6 rounded-lg shadow">
          <h2 class="text-xl font-semibold mb-3">✅ What's Working</h2>
          <ul class="space-y-2 text-sm">
            <li>• Vue 3 App Framework</li>
            <li>• Vite Build System</li>
            <li>• Vue Router</li>
            <li>• Browser API Polyfills</li>
            <li>• Component System</li>
            <li>• Tailwind CSS Styling</li>
          </ul>
        </div>

        <div class="bg-white p-6 rounded-lg shadow">
          <h2 class="text-xl font-semibold mb-3">🚀 Next Steps</h2>
          <ul class="space-y-2 text-sm">
            <li>• Replace browser blocks with Twitter blocks</li>
            <li>• Integrate Execuxion API calls</li>
            <li>• Add Twitter automation workflows</li>
            <li>• Create custom block definitions</li>
          </ul>
        </div>
      </div>

      <div class="mt-8 p-6 bg-blue-50 rounded-lg">
        <h2 class="text-xl font-semibold mb-3">🔧 Available Actions</h2>
        <div class="space-x-4">
          <button @click="testFullApp" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Test Full Automa App
          </button>
          <button @click="showInfo" class="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
            Show Debug Info
          </button>
        </div>
        <div v-if="debugInfo" class="mt-4 p-4 bg-gray-100 rounded text-sm">
          <pre>{{ debugInfo }}</pre>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      debugInfo: null
    }
  },
  methods: {
    testFullApp() {
      // Switch to full app
      window.location.href = '/index-original.html';
    },
    showInfo() {
      this.debugInfo = {
        url: window.location.href,
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        timestamp: new Date().toISOString()
      };
    }
  }
};

// Simple router
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: MinimalApp },
    { path: '/:pathMatch(.*)*', component: MinimalApp }
  ]
});

// Create and mount app
const app = createApp(MinimalApp);
app.use(router);
app.mount('#app');

console.log('Minimal Automa Web App loaded successfully!');