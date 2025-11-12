import { createApp } from 'vue';

const app = createApp({
  template: '<div><h1>Automa Web App Test</h1><p>If you see this, the basic setup works!</p></div>'
});

app.mount('#app');
console.log('Simple app loaded!');