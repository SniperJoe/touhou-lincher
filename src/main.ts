import { createApp } from 'vue';
import App from './App.vue';
import { Quasar } from 'quasar';
import quasarUserOptions from './quasar-user-options';
import { store } from './store';
import { addRendererIpcListeners } from './renderer-ipc-listeners';
import { ActionTypes } from './store/actions';

createApp(App).use(store).use(Quasar, quasarUserOptions).mount('#app');
addRendererIpcListeners(store);
store.dispatch(ActionTypes.RESTORE_APP_STATE);
