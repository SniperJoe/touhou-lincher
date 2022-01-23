<template>
    <div class="row q-pa-md gap-10 no-wrap">
        <QList bordered class="rounded-borders">
            <QItem>
                <div class="text-h6">Launcher settings</div>
            </QItem>
            <QItem>
                <QCheckbox v-model="autoClose" label="Auto-Close"></QCheckbox>
            </QItem>
            <QItem>
                <QCheckbox v-model="minimizeToTray" label="Minimize to tray"></QCheckbox>
            </QItem>
            <QItem>
                <QCheckbox v-model="showTrayIcon" label="Always show tray icon"></QCheckbox>
            </QItem>
            <QSeparator inset></QSeparator>
            <QItemLabel header>Language</QItemLabel>
            <div class="q-pl-md q-pr-md">
                <QSelect v-model="lang" :options="langs" dense emit-value map-options option-label="label" option-value="value"></QSelect>
            </div>
            <QItemLabel header>Neko Project II location:</QItemLabel>
            <div class="q-pl-md q-pr-md row gap-10">
                <PostponedInput v-model="nekoIILocation" :show-toolip="true" :validation-message="nekoIILocationValid || !nekoIILocation ? '' : 'folder not found'"></PostponedInput>
                <QBtn label="Browse" class="fit-content" @click="browse(val => { nekoIILocation = val })"></QBtn>
            </div>
            <QItemLabel header>thcrap_loader location:</QItemLabel>
            <div class="q-pl-md q-pr-md row gap-10">
                <PostponedInput v-model="thcrapLocation" :show-toolip="true" :validation-message="thcrapLocationValid || !thcrapLocation ? '' : 'thcrap configs not found'"></PostponedInput>
                <QBtn label="Browse" class="fit-content" @click="browse(val => { thcrapLocation = val })"></QBtn>
            </div>
            <QItemLabel header>thcrap starting repository:</QItemLabel>
            <div class="q-pl-md q-pr-md row gap-10">
                <PostponedInput v-model="thcrapRepository" :show-toolip="true" :validation-message="thcrapRepositoryValid || !thcrapRepository ? '' : 'could not get a valid response'"></PostponedInput>
                <QBtn label="Default" class="fit-content" @click="thcrapStartingRepositoryDefault"></QBtn>
            </div>
            <div class="q-ma-md">
                <QBtn class="full-width" label="Configure thcrap" @click="configureThcrap"></QBtn>
            </div>
         </QList>
        <QList bordered class="rounded-borders">
            <QItem>
                <div class="text-h6">Random Game settings</div>
            </QItem>
            <div class="text-center q-pl-xl q-pr-xl">Games that will be included in the<br>random game option</div>
            <div class="row justify-between q-pa-md">
                <QBtn label="Select all" @click="selectAllRandomGames"></QBtn>
                <QBtn label="Select none" @click="deselectAllRandomGames"></QBtn>
            </div>
            <QCard class="q-ml-md q-mr-md q-mb-md" v-for="(category, categoryName) in categories" :key="categoryName">
                <QItemLabel header>{{categoryTitles[categoryName]}}</QItemLabel>
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
import { GameName, SelectOptions, SupportedLang } from '@/data-types';
import { ActionTypes } from '@/store/actions';
import AutoconfigureThcrap from './AutoconfigureThcrap.vue';
import LinuxSettings from './LinuxSettings.vue';
import { computed, ref } from 'vue';
import { store } from '../store';
import PostponedInput from './PostponedInput.vue';

const lang = ref('en');
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
    return shortGameTitles[game];
}

function selectAllRandomGames() {
    store.dispatch(ActionTypes.SET_RANDOM_GAMES, { gameNames: Object.keys(shortGameTitles) as GameName[], enabled: true });
}
function deselectAllRandomGames() {
    store.dispatch(ActionTypes.SET_RANDOM_GAMES, { gameNames: Object.keys(shortGameTitles) as GameName[], enabled: false });
}

async function browse(set: (arg0: string) => void) { // eslint-disable-line no-unused-vars
    const path: string = await invokeInMain('pick-exe');
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
