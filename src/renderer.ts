import { createApp, watch } from 'vue';
import App from './App.vue';
import { Quasar } from 'quasar';
import quasarUserOptions from './quasar-user-options';
import { store } from './store';
import { addRendererIpcListeners } from './renderer-ipc-listeners';
import { ActionTypes } from './store/actions';
import { createI18n } from 'vue-i18n';
const i18n = createI18n({
    locale: 'en',
    legacy: false
});
createApp(App)
    .use(store)
    .use(i18n)
    .use(Quasar, quasarUserOptions)
    .mount('#app');
addRendererIpcListeners(store);
store.dispatch(ActionTypes.RESTORE_APP_STATE);
watch(() => store.getters.language, () => { i18n.global.locale.value = store.getters.language; });
