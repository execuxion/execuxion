import { onUnmounted, onMounted } from 'vue';
import defu from 'defu';
import Mousetrap from 'mousetrap';
import { isObject, parseJSON } from '@/utils/helper';

const defaultShortcut = {
  'page:dashboard': {
    id: 'page:dashboard',
    combo: 'mod+1',  // Standard: Ctrl/Cmd+1 for first tab
  },
  'page:workflows': {
    id: 'page:workflows',
    combo: 'mod+2',  // Standard: Ctrl/Cmd+2 for second tab
  },
  'page:schedule': {
    id: 'page:schedule',
    combo: 'mod+3',  // Standard: Ctrl/Cmd+3 for third tab
  },
  'page:logs': {
    id: 'page:logs',
    combo: 'mod+4',  // Standard: Ctrl/Cmd+4 for fourth tab
  },
  'page:storage': {
    id: 'page:storage',
    combo: 'mod+5',  // Standard: Ctrl/Cmd+5 for fifth tab
  },
  'page:settings': {
    id: 'page:settings',
    combo: 'mod+,',  // Industry standard: Ctrl/Cmd+, for settings
  },
  'action:search': {
    id: 'action:search',
    combo: 'mod+f',  // ✓ Already standard
  },
  'action:new': {
    id: 'action:new',
    combo: 'mod+n',  // Standard: Ctrl/Cmd+N for new
  },
  'editor:duplicate-block': {
    id: 'editor:duplicate-block',
    combo: 'mod+d',  // Standard: Ctrl/Cmd+D for duplicate (VS Code, Figma)
  },
  'editor:search-blocks': {
    id: 'editor:search-blocks',
    combo: 'mod+shift+f',  // Standard: Ctrl/Cmd+Shift+F for project-wide search
  },
  'editor:save': {
    id: 'editor:save',
    combo: 'mod+s',  // ✓ Already standard
  },
  'editor:execute-workflow': {
    id: 'editor:execute-workflow',
    combo: 'mod+enter',  // Standard: Ctrl/Cmd+Enter for run/execute (VS Code, IDEs)
  },
  'editor:toggle-sidebar': {
    id: 'editor:toggle-sidebar',
    combo: 'mod+b',  // Standard: Ctrl/Cmd+B for toggle sidebar (VS Code, browsers)
  },
  'editor:stop-workflow': {
    id: 'editor:stop-workflow',
    combo: 'mod+shift+x',  // Standard: Ctrl/Cmd+Shift+X for stop/terminate (VS Code)
  },
};
const customShortcut = parseJSON(localStorage.getItem('shortcuts', {})) || {};

export const mapShortcuts = defu(customShortcut, defaultShortcut);

const os = navigator.appVersion.indexOf('Mac') !== -1 ? 'mac' : 'win';
export function getReadableShortcut(str) {
  const list = {
    option: {
      win: 'alt',
      mac: 'option',
    },
    mod: {
      win: 'ctrl',
      mac: '⌘',
    },
  };
  const regex = /option|mod/g;
  const replacedStr = str.replace(regex, (match) => {
    return list[match][os];
  });

  return replacedStr;
}

export function getShortcut(id, data) {
  const shortcut = mapShortcuts[id] || {};

  if (data) shortcut.data = data;
  if (!shortcut.readable) {
    shortcut.readable = getReadableShortcut(shortcut.combo);
  }

  return shortcut;
}

export function useShortcut(shortcuts, handler) {
  Mousetrap.prototype.stopCallback = () => false;

  const extractedShortcuts = {
    ids: {},
    keys: [],
    data: {},
  };
  const handleShortcut = (event, combo) => {
    const shortcutId = extractedShortcuts.ids[combo];
    const params = {
      event,
      ...extractedShortcuts.data[shortcutId],
    };

    if (shortcutId) event.preventDefault();

    if (typeof params.data === 'function') {
      params.data(params, event);
    } else if (handler) {
      handler(params, event);
    }
  };
  const addShortcutData = ({ combo, id, readable, ...rest }) => {
    extractedShortcuts.ids[combo] = id;
    extractedShortcuts.keys.push(combo);
    extractedShortcuts.data[id] = { combo, id, readable, ...rest };
  };

  if (isObject(shortcuts)) {
    addShortcutData(getShortcut(shortcuts.id, shortcuts.data));
  } else if (typeof shortcuts === 'string') {
    addShortcutData(getShortcut(shortcuts));
  } else {
    shortcuts.forEach((item) => {
      const currentShortcut =
        typeof item === 'string' ? getShortcut(item) : item;

      addShortcutData(currentShortcut);
    });
  }

  onMounted(() => {
    Mousetrap.bind(extractedShortcuts.keys, handleShortcut);
  });
  onUnmounted(() => {
    Mousetrap.unbind(extractedShortcuts.keys);
  });

  return extractedShortcuts.data;
}
