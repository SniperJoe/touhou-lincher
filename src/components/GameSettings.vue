<i18n lang="json">
{
    "en": {
        "pc98gameSettings": "PC-98 Game Setttings",
        "windowsGameSettings": "Windows Game Settings",
        "mgDef": "Default main game executable:",
        "customDef": "Default custom.exe executable:",
        "thcrapSettings": "thcrap settings",
        "profile": "Profile",
        "gameProfile": "Game profile",
        "customProfile": "custom.exe profile",
        "wineSettings": "Wine Settings",
        "usedWine": {
            "wineExec": "Used Wine",
            "winePrefix": "Used Wine prefix"
        },
        "bannerSettings": "Banner settings",
        "coloredBanner": "Colored banner",
        "bannerIncorrect": "image not found or incorrect",
        "commandsSettings": "Commands settings",
        "withApplocale": "With Applocale",
        "edit": "Edit",
        "launchGame": "Launch game",
        "launchCustom": "Launch custom.exe",
        "setGameProfiles": "Set game profiles",
        "createThcrapProfile": "Create thcrap profile",
        "useCustomBanner": "Use custom banner",
        "browse": "Browse",
        "setColor": "Set color",
        "useCustomColor": "Use custom text color",
        "commandBefore": "Command to execute before launch",
        "commandAfter": "Command to execute after launch",
        "gameFolder": "Open game folder",
        "editVpatch": "Edit vpatch.ini",
        "greyBanner": "Grey banner",
        "gameLaunchProfileOptions": {
            "jp": "Japanese/vpatch",
            "en": "English (non-THCRAP)",
            "thcrap": "thcrap"
        },
        "cantRunThcrap": "Cannot run thcrap",
        "thcrapNotFound": "thcrap path is not properly configured",
        "thcrapProfileUnset": "thcrap profile is not set",
        "thcrapGameProfileUnset": "thcrap game profile is not set",
        "thcrapCustomProfileUnset": "thcrap custom.exe profile is not set",
        "cantOpenGameFolder": "Cannot open game folder",
        "cantFindVpatchIni": "Cannot find vpatch.ini",
        "cantFindGamePath": "No game's executable is configured and no correct game path found in thcrap",
        "default": "default",
        "none": "None"
    },
    "ru": {
        "pc98gameSettings": "Настройки игры PC-98",
        "windowsGameSettings": "Настройки Windows-игры",
        "mgDef": "Запуск по умолчанию:",
        "customDef": "Запуск custom.exe по умолчанию:",
        "thcrapSettings": "Настройки thcrap",
        "profile": "Профиль",
        "gameProfile": "Профиль игры",
        "customProfile": "Профиль custom.exe",
        "wineSettings": "Настройки Wine",
        "usedWine": {
            "wineExec": "Используемый Wine",
            "winePrefix": "Используемый префикс Wine"
        },
        "bannerSettings": "Настройки кнопки",
        "coloredBanner": "Цветной фон",
        "bannerIncorrect": "Изображение не найдено или неверно",
        "commandsSettings": "Настройки команд",
        "withApplocale": "Запуск с Applocale",
        "edit": "Изменить",
        "launchGame": "Запустить игру",
        "launchCustom": "Запустить custom.exe",
        "setGameProfiles": "Настроить профили игр",
        "createThcrapProfile": "Создать профиль thcrap",
        "useCustomBanner": "Использовать свой фон",
        "browse": "Обзор",
        "setColor": "Выбрать цвет",
        "useCustomColor": "Использовать свой цвет текста",
        "commandBefore": "Команда перед запуском игры",
        "commandAfter": "Команда после выхода из игры",
        "gameFolder": "Открыть папку с игрой",
        "editVpatch": "Редактировать vpatch.ini",
        "greyBanner": "Черно-белый фон",
        "gameLaunchProfileOptions": {
            "jp": "Японский/vpatch",
            "en": "Английский (не thcrap)",
            "thcrap": "thcrap"
        },
        "cantRunThcrap": "Невозможно запустить thcrap",
        "thcrapNotFound": "Путь к thcrap не настроен",
        "thcrapProfileUnset": "Профиль thcrap не выбран",
        "thcrapGameProfileUnset": "Профиль игры из thcrap не выбран",
        "thcrapCustomProfileUnset": "Профиль custom.exe из thcrap не выбран",
        "cantOpenGameFolder": "Невозможно открыть каталог игры",
        "cantFindVpatchIni": "vpatch.ini не найден",
        "cantFindGamePath": "Ни один исполняемый файл не настроен и корректный путь не найден в thcrap",
        "default": "по умолч.",
        "none": "Нет"
    },
    "jp": {
        "editVpatch": "vpatch.iniを編集する",
        "gameLaunchProfileOptions": {
            "jp": "日本語/vpatch.ini",
            "en": "英語 (non-THCRAP)",
            "thcrap": "thcrap"
        },
        "greyBanner": "灰色画像"
    }
}
</i18n>

<template>
    <QDialog v-if="!!$store" :modelValue="visible" @update:modelValue="emit('close')">
        <QCard style="max-width: none; width: fit-content;">
            <div :class="isPC98 ? '' : 'row main-row'">
                <div>
                    <QList bordered class="rounded-borders q-ma-md min-w-500" v-if="isPC98">
                        <QCardSection>
                            <div class="text-subtitle2">{{ t('pc98gameSettings') }}</div>
                        </QCardSection>
                        <ExecutableSetting
                            :type="'pc98'"
                            :game-name="gameName"
                            @runGame="$emit('runGame', false)">
                        </ExecutableSetting>
                    </QList>
                    <QList bordered class="rounded-borders q-ma-md min-w-500" v-else>
                        <QCardSection>
                            <div class="text-subtitle2">{{ t('windowsGameSettings') }}</div>
                        </QCardSection>
                        <QSeparator inset></QSeparator>
                        <ExecutableSetting
                            v-for="(type, index) in configurableExecutables" :key="index"
                            :type="type"
                            :gameName="gameName"
                            @runGame="$emit('runGame', type === 'custom', type)">
                        </ExecutableSetting>
                        <div class="row justify-start q-pa-md items-center">
                            <div class="text-subtitle2 title col-6">{{ t('mgDef') }}</div>
                            <QSelect class="col-6" outlined v-model="gameSettings['defaultExecutable']" :options="gameLaunchProfileOptions" dense emit-value map-options option-label="label" option-value="value"></QSelect>
                        </div>
                        <div class="row justify-start q-pa-md items-center">
                            <div class="text-subtitle2 title col-6">{{ t('customDef') }}</div>
                            <QSelect class="col-6" outlined v-model="gameSettings['defaultCustomExeExecutable']" :options="customExeLaunchProfileOptions" dense emit-value map-options option-label="label" option-value="value"></QSelect>
                        </div>
                    </QList>
                    <QList bordered class="thcrap-settings q-ma-md rounded-borders">
                        <QCardSection class="row justify-between items-center q-pt-xs q-pb-md q-pl-md q-pr-md">
                            <div class="text-subtitle2 title">{{ t('thcrapSettings') }}</div>
                            <QCheckbox v-model="gameSettings['thcrapWithAppLocale']" :label="t('withApplocale')"></QCheckbox>
                        </QCardSection>
                        <div class="row justify-start q-pl-md q-pr-md q-mb-md items-center">
                            <div class="text-subtitle2 title col-2">{{ t('profile') }}:</div>
                            <QBtn class="fit-content col-2 text-caption" color="white" text-color="black" :label="t('edit')" @click="editThcrapProfile"></QBtn>
                            <QSpace></QSpace>
                            <QSelect class="col-7" outlined emit-value map-options dense v-model="gameSettings['thcrapProfile']" :options="thcrapProfiles"></QSelect>
                        </div>
                        <div class="row justify-start q-pl-md q-pr-md q-mb-md items-center">
                            <div class="text-subtitle2 title col-5">{{ t('gameProfile') }}:</div>
                            <QSelect class="col-7" outlined emit-value map-options dense v-model="gameSettings['thcrapGameProfile']" :options="gameProfileOptions"></QSelect>
                        </div>
                        <div class="row justify-start q-pl-md q-pr-md q-mb-md items-center">
                            <div class="text-subtitle2 title col-5">{{ t('customProfile') }}:</div>
                            <QSelect class="col-7" outlined emit-value map-options dense v-model="gameSettings['thcrapCustomExeProfile']" :options="gameProfileOptions"></QSelect>
                        </div>
                        <div class="row justify-between q-pl-md q-pr-md q-mb-md items-center">
                            <QBtn class="fit-content" color="white" text-color="black" :label="t('launchGame')" @click="launchThcrap(false)"></QBtn>
                            <QBtn class="fit-content" color="white" text-color="black" :label="t('launchCustom')" @click="launchThcrap(true)"></QBtn>
                        </div>
                        <div class="row justify-between q-pl-md q-pr-md q-mb-md items-center">
                            <QBtn class="fit-content" color="white" text-color="black" :label="t('setGameProfiles')" @click="editThcrapGameProfiles"></QBtn>
                            <QBtn class="fit-content" color="white" text-color="black" :label="t('createThcrapProfile')">
                                <QPopupEdit v-model="newThcrapProfileName" buttons v-slot="scope" @save="onProfileCreated" ref="newThcrapProfileNameEdit">
                                    <QInput v-model="scope.value" dense autofocus counter @keyup.enter="scope.set"></QInput>
                                </QPopupEdit>
                            </QBtn>
                        </div>
                    </QList>
                </div>
                <div>
                    <QList bordered class="rounded-borders q-ma-md min-w-500">
                        <QCardSection>
                            <div class="text-subtitle2">{{ t('wineSettings') }}</div>
                        </QCardSection>
                        <div class="row justify-start q-pa-md items-center"  v-for="(namedPathType, index) in namedPathTypes" :key="index">
                            <div class="text-subtitle2 title col-6">{{ t(`usedWine.${namedPathType}`) }}:</div>
                            <QSelect class="col-6" outlined v-model="wineSettings[namedPathType]" :options="wineSettingsOptions[namedPathType]" dense emit-value map-options option-label="label" option-value="value"></QSelect>
                        </div>
                    </QList>
                    <QList bordered class="rounded-borders q-ma-md min-w-500 banner-settings">
                        <QCardSection>
                            <div class="text-subtitle2">{{ t('bannerSettings') }}</div>
                        </QCardSection>
                        <div class="row justify-between q-pl-md q-pr-md items-center">
                            <div class="text-subtitle2 title">{{ t('coloredBanner') }}</div>
                            <QCheckbox v-model="gameSettings['useCustomBanner']" :label="t('useCustomBanner')"></QCheckbox>
                        </div>
                        <div class="row q-pl-md q-pr-md justify-between">
                            <PostponedInput v-model="gameSettings.banner" class="path-input col-9" :validation-message="gameSettings.bannerCorrect ? '' : t('bannerIncorrect')"></PostponedInput>
                            <QBtn class="col-2 fit-content" color="white" text-color="black" :label="t('browse')" @click="browse(val => { gameSettings.banner = val })"></QBtn>
                        </div>
                        <div class="text-subtitle2 title q-pl-md q-pr-md q-mb-md">{{ t('greyBanner') }}</div>
                        <div class="row q-pl-md q-pr-md justify-between">
                            <PostponedInput v-model="gameSettings.greyBanner" class="path-input col-9" :validation-message="gameSettings.greyBannerCorrect ? '' : t('bannerIncorrect')"></PostponedInput>
                            <QBtn class="col-2 fit-content" color="white" text-color="black" :label="t('browse')" @click="browse(val => { gameSettings.greyBanner = val })"></QBtn>
                        </div>
                        <div class="row q-pl-md q-pr-md q-pb-md justify-between text-color-settings">
                            <QBtn class="fit-content col-3" color="white" text-color="black" :label="t('setColor')" @click="showColorPicker = true"></QBtn>
                            <ColorPicker v-model:color="gameSettings['textColor']" v-model:visible="showColorPicker"></ColorPicker>
                            <div class="color-display col-1" :style="`background-color: ${gameSettings['textColor'] || 'transparent' };`"></div>
                            <QCheckbox class="col-7 justify-end" v-model="gameSettings['useTextColor']" :label="t('useCustomColor')"></QCheckbox>
                        </div>
                    </QList>
                    <QList bordered class="rounded-borders q-ma-md min-w-500">
                        <QCardSection>
                            <div class="text-subtitle2">{{ t('commandsSettings') }}</div>
                        </QCardSection>
                        <PostponedInput v-model="gameSettings.commandBefore" :label="t('commandBefore')" class="q-ma-md q-mb-lg"></PostponedInput>
                        <PostponedInput v-model="gameSettings.commandAfter" :label="t('commandAfter')" class="q-ma-md"></PostponedInput>
                    </QList>
                    <div class="row">
                        <QBtn class="fit-content q-ma-md" color="white" text-color="black" :label="t('gameFolder')" @click="openGameFolder"></QBtn>
                        <QBtn class="fit-content q-ma-md" color="white" text-color="black" :label="t('editVpatch')" @click="editVpatchIni"></QBtn>
                    </div>
                </div>
            </div>
            <ErrorPopup v-model:visible="showErrorPopup" :showCloseX="true" :error="thcrapError" :errorTitle="errorTitle"></ErrorPopup>
            <ThcrapProfileEdit :profileName="gameSettings.thcrapProfile" v-model:visible="thcrapProfileEditWindowVisible" @saved="reloadThcrap"></ThcrapProfileEdit>
            <ThcrapGameProfilesEdit v-model:visible="thcrapGameProfilesEditWindowVisible" @saved="reloadThcrap"></ThcrapGameProfilesEdit>
        </QCard>
    </QDialog>
</template>

<script lang="ts" setup>
import ExecutableSetting from './ExecutableSetting.vue';
import { GameName, configurableExecutables, GameLaunchProfile, NamedPathType, namedPathTypes, GameSettings as GameSettingsType, CustomExeLaunchProfile, SelectOptions } from '../data-types';
import { ActionTypes } from '@/store/actions';
import type { QPopupEdit } from 'quasar';
import ColorPicker from './ColorPicker.vue';
import ThcrapProfileEdit from './ThcrapProfileEdit.vue';
import ErrorPopup from './ErrorPopup.vue';
import { defaultThcrapProfileData } from '../constants';
import ThcrapGameProfilesEdit from './ThcrapGameProfilesEdit.vue';
import { computed, ref, ComputedRef } from 'vue';
import { store } from '../store';
import PostponedInput from './PostponedInput.vue';
import { findGamePath } from '@/utils';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

const newThcrapProfileNameEdit = ref<QPopupEdit | null>(null);

const emit = defineEmits<
    {(e: 'runGame', isCustomExe: boolean, type?: GameLaunchProfile | CustomExeLaunchProfile): void;
    (e: 'close'): void}
>();
const props = defineProps<{visible: boolean; gameName: GameName; isPC98: boolean}>();
const gameLaunchProfileOptions: ComputedRef<SelectOptions<GameLaunchProfile>> = computed(() => [
    { value: 'jp', label: t('gameLaunchProfileOptions.jp') },
    { value: 'en', label: t('gameLaunchProfileOptions.en') },
    { value: 'thcrap', label: t('gameLaunchProfileOptions.thcrap') }
]);
const customExeLaunchProfileOptions: SelectOptions<CustomExeLaunchProfile> = [
    { value: 'thcrap', label: 'thcrap' },
    { value: 'custom', label: 'Exe' }
];
const showErrorPopup = ref(false);
const thcrapError = ref('');
const showColorPicker = ref(false);
const thcrapProfileEditWindowVisible = ref(false);
const newThcrapProfileName = ref('');
const thcrapGameProfilesEditWindowVisible = ref(false);
const errorTitle = ref(t('cantRunThcrap'));

const gameSettings = new Proxy({} as GameSettingsType, {
    get(_, prop: keyof GameSettingsType) {
        return store.getters.gameSettings(props.gameName)[prop];
    },
    set<R extends keyof GameSettingsType>(_: GameSettingsType, prop: R, value: GameSettingsType[R]) {
        const gameSettings = store.getters.gameSettings(props.gameName);
        gameSettings[prop] = value;
        store.dispatch(ActionTypes.SET_GAME_SETTINGS, { ...gameSettings, gameName: props.gameName });
        return true;
    }
});
const wineSettings = new Proxy({} as Record<NamedPathType, number>, {
    get: (_, name: NamedPathType | '__v_isRef') => {
        if (name === '__v_isRef') {
            return false;
        }
        return store.getters.gameSettings(props.gameName).wineSettings[name];
    },
    set: (_, prop: NamedPathType, value: number) => {
        if (store) {
            const gameSettings = store.getters.gameSettings(props.gameName);
            gameSettings.wineSettings[prop] = value;
            store.dispatch(ActionTypes.SET_GAME_SETTINGS, { ...gameSettings, gameName: props.gameName });
        }
        return true;
    }
});
const wineSettingsOptions = new Proxy({} as Record<NamedPathType, SelectOptions<number>>, {
    get: (_, type: NamedPathType | '__v_isRef') => {
        if (type === '__v_isRef') {
            return false;
        }
        const defaultNamedPath = store.getters.namedPaths(type).find(we => we.id === store.getters.defaultNamedPath(type));
        const defaultNamedPathName = defaultNamedPath ? defaultNamedPath.name : t('none');
        return store.getters.namedPaths(type).map(we => ({
            label: we.name,
            value: we.id
        })).concat([{ label: `(${t('default')}) ${defaultNamedPathName}`, value: -1 }]);
    }
});

const gameProfileOptions = computed(() => {
    return store.getters.thcrapGameProfiles(props.gameName).map(p => ({ label: p, value: p })).concat([{ label: t('none'), value: '' }]);
});

const thcrapProfiles = computed(() => {
    return store.getters.thcrapProfiles.map(p => ({ label: p, value: p })).concat([{ label: t('none'), value: '' }]);
});

function checkThcrapGlobalSettings() : boolean {
    if (!store.getters.thcrapFound) {
        thcrapError.value = t('thcrapNotFound');
        errorTitle.value = t('cantRunThcrap');
        showErrorPopup.value = true;
        return false;
    }
    if (!gameSettings.thcrapProfile) {
        thcrapError.value = t('thcrapProfileUnset');
        errorTitle.value = t('cantRunThcrap');
        showErrorPopup.value = true;
        return false;
    }
    return true;
}
function launchThcrap(isCustomExe: boolean) {
    if (!checkThcrapGlobalSettings()) {
        return;
    }
    if (!gameSettings.thcrapGameProfile && !isCustomExe) {
        thcrapError.value = t('thcrapGameProfileUnset');
        errorTitle.value = t('cantRunThcrap');
        showErrorPopup.value = true;
        return;
    }
    if (!gameSettings.thcrapCustomExeProfile && isCustomExe) {
        thcrapError.value = t('thcrapCustomProfileUnset');
        errorTitle.value = t('cantRunThcrap');
        showErrorPopup.value = true;
        return;
    }
    emit('runGame', isCustomExe, 'thcrap');
}
async function browse(set: (arg0: string) => void) { // eslint-disable-line no-unused-vars
    const path: string = await invokeInMain('pick-banner');
    if (path) {
        set(path);
    }
}
function editThcrapProfile() {
    if (!checkThcrapGlobalSettings()) {
        return;
    }
    thcrapProfileEditWindowVisible.value = true;
}

function editThcrapGameProfiles() {
    if (!checkThcrapGlobalSettings()) {
        return;
    }
    thcrapGameProfilesEditWindowVisible.value = true;
}

async function onProfileCreated(profileName: string) {
    profileName = profileName.endsWith('.js') ? profileName : profileName + '.js';
    await invokeInMain('save-thcrap-profile', store.getters.thcrapPath, profileName, JSON.stringify(defaultThcrapProfileData, null, '    '));
    await reloadThcrap();
    gameSettings.thcrapProfile = profileName;
    thcrapProfileEditWindowVisible.value = true;
}

async function reloadThcrap() {
    await store.dispatch(ActionTypes.TRY_LOAD_THCRAP, store.getters.thcrapPath);
}
async function openGameFolder() {
    const gamePath = await findGamePathOrShowError(t('cantOpenGameFolder'));
    if (gamePath) {
        await invokeInMain('open-folder', gamePath);
    }
}
async function editVpatchIni() {
    const gamePath = await findGamePathOrShowError(t('cantFindVpatchIni'));
    if (gamePath) {
        await invokeInMain('edit-vpatch', gamePath);
    }
}
async function findGamePathOrShowError(errorToShowTitle: string) : Promise<string | undefined> {
    const gamePath = await findGamePath(props.gameName, store);
    if (gamePath) {
        return gamePath;
    } else {
        thcrapError.value = t('cantFindGamePath');
        errorTitle.value = errorToShowTitle;
        showErrorPopup.value = true;
    }
}
</script>

<style lang="scss" scoped>
    .fit-content {
        height: fit-content !important;
    }
    .min-w-500 {
        min-width: 500px;
    }
    .banner-settings .text-color-settings .color-display {
        align-self: center;
        height: 25px;
    }
    @media(max-width: 1141px) {
        .main-row {
            width: min-content;
        }
    }
</style>
