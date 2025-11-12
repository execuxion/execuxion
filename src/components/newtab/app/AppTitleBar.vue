<template>
  <div
    class="app-title-bar fixed top-0 left-0 right-0 h-8 bg-gray-900 flex items-center justify-between select-none z-[100]"
    style="-webkit-app-region: drag"
  >
    <!-- Left: App logo and title -->
    <div class="flex items-center px-3 space-x-2">
      <img
        src="@/assets/svg/logo.svg"
        class="w-4 h-4"
        alt="Execuxion"
      />
      <span class="text-xs text-gray-300 font-medium">Execuxion</span>
    </div>

    <!-- Right: Window controls -->
    <div class="flex items-center h-full" style="-webkit-app-region: no-drag">
      <!-- Minimize -->
      <button
        class="window-control hover:bg-gray-700 h-full px-4 transition-colors duration-150"
        @click="minimize"
        title="Minimize"
      >
        <svg width="10" height="1" viewBox="0 0 10 1" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="10" height="1" fill="currentColor" class="text-gray-300" />
        </svg>
      </button>

      <!-- Maximize/Restore -->
      <button
        class="window-control hover:bg-gray-700 h-full px-4 transition-colors duration-150"
        @click="toggleMaximize"
        :title="isMaximized ? 'Restore' : 'Maximize'"
      >
        <svg v-if="!isMaximized" width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="0.5" y="0.5" width="9" height="9" stroke="currentColor" class="text-gray-300" fill="none" />
        </svg>
        <svg v-else width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="0.5" y="2.5" width="7" height="7" stroke="currentColor" class="text-gray-300" fill="none" />
          <rect x="2.5" y="0.5" width="7" height="7" stroke="currentColor" class="text-gray-300" fill="none" />
        </svg>
      </button>

      <!-- Close -->
      <button
        class="window-control window-control-close hover:bg-red-600 h-full px-4 transition-colors duration-150"
        @click="close"
        title="Close"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0.5 0.5 L9.5 9.5 M9.5 0.5 L0.5 9.5" stroke="currentColor" class="text-gray-300" stroke-width="1" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const isMaximized = ref(false);

onMounted(async () => {
  // Check if window is maximized on mount
  if (window.electron?.window) {
    isMaximized.value = await window.electron.window.isMaximized();
  }
});

function minimize() {
  if (window.electron?.window) {
    window.electron.window.minimize();
  }
}

async function toggleMaximize() {
  if (window.electron?.window) {
    await window.electron.window.maximize();
    isMaximized.value = await window.electron.window.isMaximized();
  }
}

function close() {
  if (window.electron?.window) {
    window.electron.window.close();
  }
}
</script>

<style scoped>
.app-title-bar {
  /* Ensure it's above everything */
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.window-control {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  cursor: pointer;
  outline: none;
}

.window-control svg {
  pointer-events: none;
}

.window-control-close:hover {
  background-color: #dc2626 !important;
}

.window-control-close:hover svg path,
.window-control-close:hover svg rect {
  stroke: white !important;
}

/* Prevent text selection */
.select-none {
  -webkit-user-select: none;
  user-select: none;
}
</style>
