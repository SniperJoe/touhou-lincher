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
          <QTabPanel name="replays">
              <Replays></Replays>
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
import { ref, watch } from 'vue';
import CustomGames from './components/CustomGames.vue';
import Replays from './components/Replays.vue';
import { configurableExecutables, GameName, gameNames } from './data-types';
import { thcrapGameNames } from './constants';

const tabSelected = ref('games');
watch(() => tabSelected.value, () => {
    invokeInMain('close-replays-repository');
});

store.dispatch(ActionTypes.RESTORE_APP_STATE);
onIpcMessage('get-replays-path', (_, url: string) => getReplaysPath(url));
async function getReplaysPath(url:string) {
    const fileName = url.substring(url.lastIndexOf('/') + 1);
    const gameName = gameNameFromReplayFilename(fileName);
    if (gameName) {
        for (const configurableExecutable of configurableExecutables) {
            const path = store.getters.gameSettings(gameName).executables[configurableExecutable].path;
            if (path) {
                await invokeInMain('save-replay', url, path, gameName);
                return;
            }
        }
        const thcrapMainGamePath = store.getters.thcrapMainGamePath(gameName);
        if (thcrapMainGamePath) {
            const path = await invokeInMain('search-windows-path', thcrapMainGamePath, store.getters.namedPaths('winePrefix').map(wp => wp.path));
            if (path) {
                await invokeInMain('save-replay', url, path, gameName);
                return;
            }
        }
    }
    await invokeInMain('save-replay', url, '', gameName);
}
function gameNameFromReplayFilename(fileName: string): GameName | undefined {
    const thcrapLikeGameNameMatch = fileName.match(/^th\d+/);
    if (thcrapLikeGameNameMatch) {
        const thcrapGameName = thcrapLikeGameNameMatch[0].replace(/^th(\d)$/, 'th0$1');
        return gameNames.find(gn => thcrapGameNames[gn] === thcrapGameName);
    }
}
</script>

<style lang="scss">
.main-menu {
    position: sticky !important;
    top: 0;
    z-index: 3;
}
</style>
