<i18n lang="json">
{
    "en": {
        "launcherSettings": "Launcher settings",
        "autoClose": "Auto-Close",
        "minimizeToTray":"Minimize to tray",
        "alwaysShowTrayIcon": "Always show tray icon",
        "language": "Language",
        "nekoIILocation": "Neko Project II location",
        "thcrapLocation": "thcrap_loader location",
        "np2Notfound": "Neko Project not found",
        "thcrapNotFound": "thcrap configs not found",
        "thcrapStartingRepo": "thcrap starting repository",
        "responseInvalid": "could not get a valid response",
        "randomGameSettings": "Random Game settings",
        "randomGames": "Games that will be included in the\nrandom game option",
        "configThcrap": "Configure thcrap",
        "browse": "Browse",
        "default": "Default",
        "selectAll": "Select all",
        "selectNone": "Select none",
        "autoCloseExplain": "Automatically close the launcher after launching a game"
    },
    "ru": {
        "launcherSettings": "Общие настройки",
        "autoClose": "Автозакрытие",
        "minimizeToTray":"Сворачивать в трей",
        "alwaysShowTrayIcon": "Всегда показывать иконку в трее",
        "language": "Язык",
        "nekoIILocation": "Путь к Neko Project II",
        "thcrapLocation": "Путь к thcrap_loader",
        "np2Notfound": "Neko Project не найден",
        "thcrapNotFound": "Настройки thcrap не найдены",
        "thcrapStartingRepo": "Стартовый репозиторий thcrap",
        "responseInvalid": "Получен некорректный ответ",
        "randomGameSettings": "Настройки случайного запуска",
        "randomGames": "Игры, которые будут включены в\nслучайный запуск",
        "configThcrap": "Настроить thcrap",
        "browse": "Обзор",
        "default": "По умолчанию",
        "selectAll": "Выбрать все",
        "selectNone": "Снять выбор",
        "autoCloseExplain": "Автоматически закрывать программу после запуска игры"
    },
    "jp": {
        "selectAll": "全部",
        "selectNone": "なし",
        "language": "語",
        "alwaysShowTrayIcon": "トレイアイコンを常に表示する",
        "randomGames": "漫然着手に含まれるゲーム",
        "randomGameSettings": "漫然着手の構成"
    }
}
</i18n>

<template>
    <div class="row q-pa-md gap-10 no-wrap">
        <QList bordered class="rounded-borders">
            <QItem>
                <div class="text-h6">{{ t('launcherSettings') }}</div>
            </QItem>
            <QItem>
                <QCheckbox v-model="autoClose" :label="t('autoClose')">
                    <QTooltip anchor="top right" self="bottom middle">{{ t('autoCloseExplain') }}</QTooltip>
                </QCheckbox>
            </QItem>
            <QItem>
                <QCheckbox v-model="minimizeToTray" :label="t('minimizeToTray')"></QCheckbox>
            </QItem>
            <QItem>
                <QCheckbox v-model="showTrayIcon" :label="t('alwaysShowTrayIcon')"></QCheckbox>
            </QItem>
            <QSeparator inset></QSeparator>
            <QItemLabel header>{{ t('language') }}</QItemLabel>
            <div class="q-pl-md q-pr-md">
                <QSelect v-model="lang" :options="langs" dense emit-value map-options option-label="label" option-value="value"></QSelect>
            </div>
            <QItemLabel header>{{ t('nekoIILocation') }}:</QItemLabel>
            <div class="q-pl-md q-pr-md row gap-10 justify-between">
                <PostponedInput v-model="nekoIILocation" :show-toolip="true" :validation-message="nekoIILocationValid || !nekoIILocation ? '' : t('np2Notfound')"></PostponedInput>
                <QBtn :label="t('browse')" class="fit-content" @click="browse(val => { nekoIILocation = val }, true)"></QBtn>
            </div>
            <QItemLabel header>{{ t('thcrapLocation') }}:</QItemLabel>
            <div class="q-pl-md q-pr-md row gap-10 justify-between">
                <PostponedInput v-model="thcrapLocation" :show-toolip="true" :validation-message="thcrapLocationValid || !thcrapLocation ? '' : t('thcrapNotFound')"></PostponedInput>
                <QBtn :label="t('browse')" class="fit-content" @click="browse(val => { thcrapLocation = val }, false)"></QBtn>
            </div>
            <QItemLabel header>{{ t('thcrapStartingRepo') }}:</QItemLabel>
            <div class="q-pl-md q-pr-md row gap-10 justify-between">
                <PostponedInput v-model="thcrapRepository" :show-toolip="true" :validation-message="thcrapRepositoryValid || !thcrapRepository ? '' : t('responseInvalid')"></PostponedInput>
                <QBtn :label="t('default')" class="fit-content" @click="thcrapStartingRepositoryDefault"></QBtn>
            </div>
            <div class="q-ma-md">
                <QBtn class="full-width" :label="t('configThcrap')" @click="configureThcrap"></QBtn>
            </div>
         </QList>
        <QList bordered class="rounded-borders">
            <QItem>
                <div class="text-h6">{{ t('randomGameSettings') }}</div>
            </QItem>
            <div class="text-center q-pl-xl q-pr-xl" style="white-space: pre;">{{ t('randomGames') }}</div>
            <div class="row justify-between q-pa-md">
                <QBtn :label="t('selectAll')" @click="selectAllRandomGames"></QBtn>
                <QBtn :label="t('selectNone')" @click="deselectAllRandomGames"></QBtn>
            </div>
            <QCard class="q-ml-md q-mr-md q-mb-md" v-for="(category, categoryName) in categories" :key="categoryName">
                <QItemLabel header>{{ categoryTitles[categoryName][store.getters.language] }}</QItemLabel>
                <div class="checkboxes">
                    <QCheckbox v-for="(game, index) in category" :key="index" v-model="enabledRandomGames[game]" :label="getGameTitle(game)"></QCheckbox>
                </div>
            </QCard>
        </QList>
        <AutoconfigureThcrap v-model:visible="suggestThcrapAutoconfig"></AutoconfigureThcrap>
    </div>
    <LinuxSettings></LinuxSettings>
</template>

<script lang="ts" setup>
import { shortGameTitles, categories, categoryTitles } from '@/constants';
import { GameName, gameNames, SelectOptions, SupportedLang } from '@/data-types';
import { ActionTypes } from '@/store/actions';
import AutoconfigureThcrap from './AutoconfigureThcrap.vue';
import LinuxSettings from './LinuxSettings.vue';
import { computed, WritableComputedRef, ref } from 'vue';
import { store } from '../store';
import PostponedInput from './PostponedInput.vue';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

const lang: WritableComputedRef<SupportedLang> = computed({
    get: () => store.getters.language,
    set: (v) => {
        store.dispatch(ActionTypes.SET_LANG, v);
    }
});
const langs : SelectOptions<SupportedLang> = [{ label: 'English', value: 'en' }, { label: '日本語', value: 'jp' }, { label: 'Русский', value: 'ru' }];
const nekoIILocation = computed({
    get: () => store.getters.nekoProjectPath,
    set: (v: string) => store.dispatch(ActionTypes.SET_NEKO_PROJECT_PATH, v)
});
const thcrapLocation = computed({
    get: () => store.getters.thcrapPath,
    set: (v: string) => store.dispatch(ActionTypes.SET_THCRAP_PATH, v).then(() => {
        if (store.getters.thcrapFound) {
            suggestThcrapAutoconfig.value = true;
        }
    })
});
const thcrapRepository = computed({
    get: () => store.getters.thcrapStartingRepository,
    set: (v: string) => store.dispatch(ActionTypes.SET_THCRAP_STARTING_REPOSITORY, v)
});
const nekoIILocationValid = computed(() => store.getters.nekoProjectPathValid);
const thcrapLocationValid = computed(() => store.getters.thcrapFound);
const thcrapRepositoryValid = computed(() => store.getters.thcrapStartingRepositoryValid);

const suggestThcrapAutoconfig = ref(false);
const enabledRandomGames: Partial<Record<GameName, boolean>> = new Proxy({}, {
    get: (_, name) => {
        return store.getters.randomGamesIncludes(name as GameName);
    },
    set: (_, prop: GameName, value: boolean) => {
        store.dispatch(ActionTypes.SET_RANDOM_GAME, { gameName: prop, enabled: value });
        return true;
    }
});

const autoClose = computed({
    get() {
        return store.getters.autoClose;
    },
    set(value: boolean) {
        store.dispatch(ActionTypes.SET_AUTO_CLOSE, value);
    }
});

const minimizeToTray = computed({
    get() {
        return store.getters.minimizeToTray;
    },
    set(value: boolean) {
        store.dispatch(ActionTypes.SET_MINIMIZE_TO_TRAY, value);
    }
});
const showTrayIcon = computed({
    get() {
        return store.getters.showTrayIcon;
    },
    set(value: boolean) {
        store.dispatch(ActionTypes.SET_SHOW_TRAY_ICON, value);
    }
});

function getGameTitle(game: GameName) {
    return shortGameTitles[store.getters.language][game];
}

function selectAllRandomGames() {
    store.dispatch(ActionTypes.SET_RANDOM_GAMES, { gameNames: Array.from(gameNames), enabled: true });
}
function deselectAllRandomGames() {
    store.dispatch(ActionTypes.SET_RANDOM_GAMES, { gameNames: Array.from(gameNames), enabled: false });
}

async function browse(set: (arg0: string) => void, allowLinuxExe: boolean) { // eslint-disable-line no-unused-vars
    const path: string = await invokeInMain('pick-exe', allowLinuxExe);
    if (path) {
        set(path);
    }
}
async function thcrapStartingRepositoryDefault() {
    await store.dispatch(ActionTypes.SET_DEFAULT_THCRAP_STARTING_REPOSITORY);
}
async function configureThcrap() {
    if (store.getters.thcrapFound) {
        await invokeInMain('configure-thcrap', store.getters.thcrapPath);
    }
}
</script>

<style lang="scss" scoped>
    .gap-10 {
        gap: 10px;
    }
    .checkboxes {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
    }
    .fit-content {
        height: fit-content;
    }
</style>
