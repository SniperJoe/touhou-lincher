<template>
    <QCard class="shadow-transition game-card" :class="hovered ? 'shadow-6' : 'shadow-3'" @mouseenter="hovered = true" @mouseleave="hovered = false" @click="launchGame(false)">
        <div class="banner" :class="{greyscale: !configured}">
            <slot v-if="showBanner && !(configured ? gameSettings.bannerCorrect && gameSettings.useCustomBanner : gameSettings.greyBannerCorrect && gameSettings.useCustomBanner)"></slot>
            <QImg class="colored-banner" v-if="gameSettings.bannerCorrect && configured && gameSettings.useCustomBanner" :src="customBannerBase64"></QImg>
            <QImg class="grey-banner" v-if="gameSettings.greyBannerCorrect && !configured && gameSettings.useCustomBanner" :src="customGreyBannerBase64"></QImg>
        </div>
        <div
            v-if="showText"
            class="absolute-full text-left game-title text-weight-medium"
            :class="!useCustomTextColor ? (showBanner ? `color-${nameColor}` : 'color-10') : ''"
            :style="useCustomTextColor ? `color: ${gameSettings.textColor}` : ''">
          {{ title }}
        </div>
        <QMenu context-menu touch-position>
            <QItem clickable v-close-popup @click="configureGame">
                <QItemSection>Configure Game</QItemSection>
            </QItem>
            <QItem clickable v-close-popup v-if="customExeConfigured" @click="launchGame(true)">
                <QItemSection>Launch custom.exe</QItemSection>
            </QItem>
            <QItem clickable>
                <QItemSection>Edit Button</QItemSection>
                <QItemSection side>
                    <QIcon name="keyboard_arrow_right"></QIcon>
                </QItemSection>
                <QMenu anchor="top end" self="top start">
                    <QList>
                        <QItem>
                            <QItemSection>
                                <QCheckbox :modelValue="showBanner" @update:modelValue="toggleShowBanner" label="Show banner"></QCheckbox>
                            </QItemSection>
                        </QItem>
                        <QItem>
                            <QItemSection>
                                <QCheckbox :modelValue="showText" @update:modelValue="toggleShowText" label="Show text"></QCheckbox>
                            </QItemSection>
                        </QItem>
                    </QList>
                </QMenu>
            </QItem>
        </QMenu>
    </QCard>
    <GameSettings :visible="settingsOpened" :gameName="gameName" :isPC98="isPC98" @close="onSettingsClosed" @runGame="launchGame"></GameSettings>
    <ErrorPopup v-model:visible="runGameErrorVisible" :showCloseX="true" :error="runGameError" :errorTitle="`Cannot run ${title}`"></ErrorPopup>
</template>

<script lang="ts" setup>
import { ActionTypes } from '@/store/actions';
import GameSettings from './GameSettings.vue';
import { gameTitles } from '@/constants';
import { GameLaunchProfile, GameName, RunWindowsGameParams, gameConfigurableExecutables, CustomExeLaunchProfile, customExeLaunchProfiles, RunPC98GameParams } from '@/data-types';
import ErrorPopup from './ErrorPopup.vue';
import { computed, ref, watch } from 'vue';
import { store } from '../store';

const props = defineProps<{gameName: GameName, nameColor: number}>();

const hovered = ref(false);
const settingsOpened = ref(false);
const customBannerBase64 = ref('');
const customGreyBannerBase64 = ref('');
const runGameError = ref('');
const runGameErrorVisible = ref(false);
const pc98runErrors: Record<string, string> = {
    nekoPath: 'Neko Project II location is not properly configured',
    winePrefix: 'Wine prefix is not properly configured and no default prefix found',
    writeConfig: 'An error occuried while writing Neko Project II config file',
    configIncorrect: 'Neko Project II config file incorrect (does not contain "HDD1FILE=" string)',
    hdiPath: 'Game HDI path is incorrect or unset'
};

const gameSettings = computed(() => {
    return store.getters.gameSettings(props.gameName);
});
const showBanner = computed(() => {
    return gameSettings.value.showBanner;
});
const showText = computed(() => {
    return gameSettings.value.showText;
});
const title = computed(() => {
    return gameTitles[props.gameName];
});
const configured = computed(() => {
    return isPC98.value ? isPC98GameConfigured() : isWindowsGameConfigured();
});

const customExeConfigured = computed(() => {
    return isPC98.value ? false : (gameSettings.value.thcrapProfile &&
        gameSettings.value.thcrapCustomExeProfile &&
        store.getters.thcrapFound
    ) || !!gameSettings.value.executables.custom.path;
});
const useCustomTextColor = computed(() => {
    return gameSettings.value.useTextColor && !!gameSettings.value.textColor;
});
const isPC98 = computed(() => {
    return ['hrtp', 'soew', 'podd', 'lls', 'ms'].includes(props.gameName);
});

function toggleShowBanner() {
    const settings = gameSettings.value;
    store.dispatch(ActionTypes.SET_GAME_SETTINGS, { ...settings, gameName: props.gameName, showBanner: !settings.showBanner });
}

function toggleShowText() {
    const settings = gameSettings.value;
    store.dispatch(ActionTypes.SET_GAME_SETTINGS, { ...settings, gameName: props.gameName, showText: !settings.showText });
}

async function configureGame() {
    settingsOpened.value = true;
}

function onSettingsClosed() {
    settingsOpened.value = false;
}
async function launchGame(isCustomExe: boolean, type?: GameLaunchProfile | CustomExeLaunchProfile) {
    const settings = gameSettings.value;
    if (isPC98.value) {
        const params: RunPC98GameParams = {
            gameSettings: settings,
            defaultWinePrefix: store.getters.defaultNamedPath('winePrefix'),
            defaultWineExec: store.getters.defaultNamedPath('wineExec'),
            winePrefixes: store.getters.namedPaths('winePrefix'),
            wineExecs: store.getters.namedPaths('wineExec'),
            nekoProjectPath: store.getters.nekoProjectPath,
            nekoProjectPathValid: store.getters.nekoProjectPathValid,
            commandsBefore: [store.getters.commandBefore, settings.commandBefore],
            commandsAfter: [store.getters.commandAfter, settings.commandAfter]
        };
        const error = await invokeInMain('run-pc98-game', JSON.stringify(params));
        if (error) {
            runGameError.value = pc98runErrors[error] || error;
            runGameErrorVisible.value = true;
        }
    } else {
        if (type) {
            if (!isCustomExe && isGameLaunchProfile(type)) {
                settings.defaultExecutable = type;
            } else if (isCustomExe && isCustomExeLaunchProfile(type)) {
                settings.defaultCustomExeExecutable = type;
            }
        }
        const params: RunWindowsGameParams = {
            gameSettings: settings,
            defaultWinePrefix: store.getters.defaultNamedPath('winePrefix'),
            defaultWineExec: store.getters.defaultNamedPath('wineExec'),
            winePrefixes: store.getters.namedPaths('winePrefix'),
            wineExecs: store.getters.namedPaths('wineExec'),
            thcrapPath: store.getters.thcrapPath,
            thcrapFound: store.getters.thcrapFound,
            isCustomExe,
            commandsBefore: [store.getters.commandBefore, settings.commandBefore],
            commandsAfter: [store.getters.commandAfter, settings.commandAfter]
        };
        await invokeInMain('run-game', JSON.stringify(params));
    }
}
function isGameLaunchProfile(typ: GameLaunchProfile | CustomExeLaunchProfile): typ is GameLaunchProfile {
    return typ !== 'custom';
}
function isCustomExeLaunchProfile(typ: GameLaunchProfile | CustomExeLaunchProfile): typ is CustomExeLaunchProfile {
    return (Array.from(customExeLaunchProfiles) as string[]).includes(typ);
}
async function onCustomBannerChanged() {
    if (gameSettings.value.bannerCorrect) {
        customBannerBase64.value = await invokeInMain('load-img', gameSettings.value.banner);
    }
}
async function onCustomGreyBannerChanged() {
    if (gameSettings.value.greyBannerCorrect) {
        customGreyBannerBase64.value = await invokeInMain('load-img', gameSettings.value.greyBanner);
    }
}
watch(() => gameSettings.value.banner, onCustomBannerChanged);
watch(() => gameSettings.value.greyBanner, onCustomGreyBannerChanged);
function isWindowsGameConfigured(): boolean {
    return (gameSettings.value.thcrapProfile &&
        gameSettings.value.thcrapGameProfile &&
        store.getters.thcrapFound
    ) || gameConfigurableExecutables.some(exec => gameSettings.value.executables[exec].path);
}
function isPC98GameConfigured(): boolean {
    return store.getters.nekoProjectPathValid && !!gameSettings.value.hdiPath;
}
onCustomBannerChanged();
onCustomGreyBannerChanged();
</script>

<style lang="scss">
@use "sass:string";
@import '../styles/quasar.scss';
.game-card {
    overflow: hidden;
    cursor: pointer;
    .banner.greyscale img{
        filter: grayscale(1);
    }
    .game-title {
        display: flex;
        align-items: center;
        margin: 0 10px;
        &.color-1 {
            color: $grey-1;
        }
        &.color-2 {
            color: $grey-2;
        }
        &.color-3 {
            color: $grey-3;
        }
        &.color-4 {
            color: $grey-4;
        }
        &.color-5 {
            color: $grey-5;
        }
        &.color-6 {
            color: $grey-6;
        }
        &.color-7 {
            color: $grey-7;
        }
        &.color-8 {
            color: $grey-8;
        }
        &.color-9 {
            color: $grey-9;
        }
        &.color-10 {
            color: $grey-10;
        }
    }
}
</style>
