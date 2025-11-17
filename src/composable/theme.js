import { ref, onMounted, onUnmounted } from 'vue';
import browser from 'webextension-polyfill';

const themes = [
  { name: 'Light', id: 'light' },
  { name: 'Dark', id: 'dark' },
  { name: 'System', id: 'system' },
];
const isPreferDark = () =>
  window.matchMedia('(prefers-color-scheme: dark)').matches;

export function useTheme() {
  const activeTheme = ref('system');
  let mediaQueryListener = null;

  async function setTheme(theme) {
    const isValidTheme = themes.some(({ id }) => id === theme);

    if (!isValidTheme) return;

    let isDarkTheme = theme === 'dark';

    if (theme === 'system') isDarkTheme = isPreferDark();

    document.documentElement.classList.toggle('dark', isDarkTheme);
    activeTheme.value = theme;

    await browser.storage.local.set({ theme });
  }
  async function getTheme() {
    let { theme } = await browser.storage.local.get('theme');

    // Default to system theme (auto-detect from OS)
    if (!theme) theme = 'system';

    return theme;
  }
  async function init() {
    const theme = await getTheme();

    await setTheme(theme);

    // Listen for OS theme changes when in system mode
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    mediaQueryListener = async (e) => {
      const currentTheme = await getTheme();
      // Only update if user is using system theme
      if (currentTheme === 'system') {
        document.documentElement.classList.toggle('dark', e.matches);
      }
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', mediaQueryListener);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(mediaQueryListener);
    }
  }

  onMounted(async () => {
    activeTheme.value = await getTheme();
  });

  onUnmounted(() => {
    // Clean up listener when component unmounts
    if (mediaQueryListener) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', mediaQueryListener);
      } else {
        mediaQuery.removeListener(mediaQueryListener);
      }
    }
  });

  return {
    init,
    themes,
    activeTheme,
    set: setTheme,
    get: getTheme,
  };
}
