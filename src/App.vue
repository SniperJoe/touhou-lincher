<template>
    <QTabs v-model="tabSelected" no-caps inline-label align="left" class="bg-white text-black shadow-2 main-menu">
        <QTab name="games" icon="games" label="Games"></QTab>
        <QTab name="customGames" icon="dashboard_customize" label="Custom Games"></QTab>
        <QTab name="replays" icon="movie" label="Replays"></QTab>
        <QTab name="settings" icon="settings" label="Settings"></QTab>
        <QTab name="info" icon="info" label="Info"></QTab>
    </QTabs>
    <QTabPanels v-model="tabSelected">
          <QTabPanel name="games">
              <Games></Games>
          </QTabPanel>
          <QTabPanel name="customGames">
              <CustomGames></CustomGames>
          </QTabPanel>
          <QTabPanel name="settings">
              <GlobalSettings></GlobalSettings>
          </QTabPanel>
    </QTabPanels>
</template>

<script lang="ts" setup>
import Games from './components/Games.vue';
import { ActionTypes } from './store/actions';
import GlobalSettings from './components/GlobalSettings.vue';
import { store } from './store';
import { ref } from 'vue';
import CustomGames from './components/CustomGames.vue';

const tabSelected = ref('games');

store.dispatch(ActionTypes.RESTORE_APP_STATE);
</script>

<style lang="scss">
.main-menu {
    position: sticky !important;
    top: 0;
    z-index: 3;
}
</style>
