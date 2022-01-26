<i18n lang="json">
{
    "en": {
        "games": "Games",
        "customGames": "Custom Games",
        "replays": "Replays",
        "settings": "Settings",
        "info": "Info"
    },
    "ru": {
        "games": "Игры",
        "customGames": "Другие игры",
        "replays": "Повторы",
        "settings": "Настройки",
        "info": "Информация"
    },
    "jp": {
        "games": "ゲーム",
        "replays": "リプレイ",
        "settings": "設定",
        "customGames": "非東方ゲーム",
        "info": "情報"
    }
}
</i18n>
<template>
    <QTabs v-model="tabSelected" no-caps inline-label align="left" class="bg-white text-black shadow-2 main-menu">
        <QTab name="games" icon="games" :label="t('games')"></QTab>
        <QTab name="customGames" icon="dashboard_customize" :label="t('customGames')"></QTab>
        <QTab name="replays" icon="movie" :label="t('replays')"></QTab>
        <QTab name="settings" icon="settings" :label="t('settings')"></QTab>
        <QTab name="info" icon="info" :label="t('info')"></QTab>
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
          <QTabPanel name="info">
              <Info></Info>
          </QTabPanel>
    </QTabPanels>
</template>

<script lang="ts" setup>
import Games from './components/Games.vue';
import GlobalSettings from './components/GlobalSettings.vue';
import { ref, watch } from 'vue';
import CustomGames from './components/CustomGames.vue';
import Replays from './components/Replays.vue';
import { useI18n } from 'vue-i18n';
import Info from './components/Info.vue';
const { t } = useI18n();

const tabSelected = ref('games');
watch(() => tabSelected.value, () => {
    invokeInMain('close-replays-repository');
});
</script>

<style lang="scss">
.main-menu {
    position: sticky !important;
    top: 0;
    z-index: 3;
}
</style>
