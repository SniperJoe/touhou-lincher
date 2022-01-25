<i18n lang="json">
{
    "en": {
        "config": "Configure Game",
        "runCustom": "Launch custom.exe",
        "editBtn": "Edit Button",
        "showBanner": "Show banner",
        "showText": "Show text",
        "cannotRun": "Cannot run {title}",
        "nekoPath": "Neko Project II location is not properly configured",
        "winePrefix": "Wine prefix is not properly configured and no default prefix found",
        "writeConfig": "An error occuried while writing Neko Project II config file",
        "configIncorrect": "Neko Project II config file incorrect (does not contain \"HDD1FILE=\" string)",
        "hdiPath": "Game HDI path is incorrect or unset"
    },
    "ru": {
        "config": "Настроить игру",
        "runCustom": "Запустить custom.exe",
        "editBtn": "Настроить кнопку",
        "showBanner": "Показать картинку",
        "showText": "Показать текст",
        "cannotRun": "Невозможно запустить {title}",
        "nekoPath": "Путь к Neko Project II не настроен или настроен неверно",
        "winePrefix": "Префикс Wine не настроен или настроен неверно и префикс по умолчанию не найден",
        "writeConfig": "Произошла ошибка во время перезаписи конфигурационного файла Neko Project II",
        "configIncorrect": "Конфигурационный файл Neko Project II некорректен (не содержит строку \"HDD1FILE=\")",
        "hdiPath": "Путь к HDI образу игры не указан или неверен"
    }
}
</i18n>

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
                <QItemSection>{{ t('config') }}</QItemSection>
            </QItem>
            <QItem clickable v-close-popup v-if="customExeConfigured" @click="launchGame(true)">
                <QItemSection>{{ t('runCustom') }}</QItemSection>
            </QItem>
            <QItem clickable>
                <QItemSection>{{ t('editBtn') }}</QItemSection>
                <QItemSection side>
                    <QIcon name="keyboard_arrow_right"></QIcon>
                </QItemSection>
                <QMenu anchor="top end" self="top start">
                    <QList>
                        <QItem>
                            <QItemSection>
                                <QCheckbox :modelValue="showBanner" @update:modelValue="toggleShowBanner" :label="t('showBanner')"></QCheckbox>
                            </QItemSection>
                        </QItem>
                        <QItem>
                            <QItemSection>
                                <QCheckbox :modelValue="showText" @update:modelValue="toggleShowText" :label="t('showText')"></QCheckbox>
                            </QItemSection>
                        </QItem>
                    </QList>
                </QMenu>
            </QItem>
        </QMenu>
    </QCard>
    <GameSettings :visible="settingsOpened" :gameName="gameName" :isPC98="isPC98" @close="onSettingsClosed" @runGame="launchGame"></GameSettings>
    <ErrorPopup v-model:visible="runGameErrorVisible" :showCloseX="true" :error="runGameError" :errorTitle="t('cannotRun')"></ErrorPopup>
</template>

<script lang="ts" setup>
import { ActionTypes } from '@/store/actions';
import GameSettings from './GameSettings.vue';
import { gameTitles } from '@/constants';
import { GameLaunchProfile, GameName, CustomExeLaunchProfile } from '@/data-types';
import ErrorPopup from './ErrorPopup.vue';
import { computed, ref, watch } from 'vue';
import { store } from '../store';
import { isGameConfigured, isPC98 as getIsPC98, runGame } from '@/utils';
import { useI18n } from 'vue-i18n';
const { t, te } = useI18n();

const props = defineProps<{gameName: GameName, nameColor: number}>();

const hovered = ref(false);
const settingsOpened = ref(false);
const customBannerBase64 = ref('');
const customGreyBannerBase64 = ref('');
const runGameError = ref('');
const runGameErrorVisible = ref(false);

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
const configured = computed(() => isGameConfigured(props.gameName, gameSettings.value, store.getters.nekoProjectPathValid, store.getters.thcrapFound));

const customExeConfigured = computed(() => {
    return isPC98.value ? false : (gameSettings.value.thcrapProfile &&
        gameSettings.value.thcrapCustomExeProfile &&
        store.getters.thcrapFound
    ) || !!gameSettings.value.executables.custom.path;
});
const useCustomTextColor = computed(() => {
    return gameSettings.value.useTextColor && !!gameSettings.value.textColor;
});
const isPC98 = computed(() => getIsPC98(props.gameName));

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
    const error = await runGame(props.gameName, store, isCustomExe, type);
    if (error) {
        runGameError.value = te(error) ? t(error) : error;
        runGameErrorVisible.value = true;
    }
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
