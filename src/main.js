// Web app entry point - adapted from newtab/index.js
import { createApp } from 'vue';
import { createHead } from '@vueuse/head';
import App from './newtab/App.vue';
import router from './newtab/router';
import pinia from './lib/pinia';
import compsUi from './lib/compsUi';
import vueI18n from './lib/vueI18n';
import vRemixicon, { icons } from './lib/vRemixicon';
import vueToastification from './lib/vue-toastification';

// Import styles
import './assets/css/tailwind.css';
import './assets/css/fonts.css';
import './assets/css/style.css';
import './assets/css/flow.css';

const head = createHead();

const app = createApp(App);

app.use(head);
app.use(router);
app.use(compsUi);
app.use(pinia);
app.use(vueI18n);
app.use(vueToastification);
app.use(vRemixicon, icons);

// Mount the app
app.mount('#app');

console.log('Automa Web App started successfully!');