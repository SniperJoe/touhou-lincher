<template>
    <QDialog v-if="!!$store" :modelValue="visible" @update:modelValue="emit('close')">
        <QCard style="max-width: none; width: fit-content;">
            <div :class="isPC98 ? '' : 'row main-row'">
                <div>
                    <QList bordered class="rounded-borders q-ma-md min-w-500" v-if="isPC98">
                        <QCardSection>
                            <div class="text-subtitle2">PC-98 Game Setttings</div>
                        </QCardSection>
                        <ExecutableSetting
                            :type="'pc98'"
                            :game-name="gameName"
                            @runGame="$emit('runGame', false)">
                        </ExecutableSetting>
                    </QList>
                    <QList bordered class="rounded-borders q-ma-md min-w-500" v-else>
                        <QCardSection>
                            <div class="text-subtitle2">Windows Game Settings</div>
                        </QCardSection>
                        <QSeparator inset></QSeparator>
                        <ExecutableSetting
                            v-for="(type, index) in configurableExecutables" :key="index"
                            :type="type"
                            :gameName="gameName"
                            @runGame="$emit('runGame', type === 'custom', type)">
                        </ExecutableSetting>
                        <div class="row justify-start q-pa-md items-center">
                            <div class="text-subtitle2 title col-6">Default main game executable:</div>
                            <QSelect class="col-6" outlined v-model="gameSettings['defaultExecutable']" :options="gameLaunchProfileOptions" dense emit-value map-options option-label="label" option-value="value"></QSelect>
                        </div>
                        <div class="row justify-start q-pa-md items-center">
                            <div class="text-subtitle2 title col-6">Default custom.exe executable:</div>
                            <QSelect class="col-6" outlined v-model="gameSettings['defaultCustomExeExecutable']" :options="customExeLaunchProfileOptions" dense emit-value map-options option-label="label" option-value="value"></QSelect>
                        </div>
                    </QList>
                    <QList bordered class="thcrap-settings q-ma-md rounded-borders">
                        <QCardSection class="row justify-between items-center q-pt-xs q-pb-md q-pl-md q-pr-md">
                            <div class="text-subtitle2 title">thcrap settings</div>
                            <QCheckbox v-model="gameSettings['thcrapWithAppLocale']" label="With Applocale"></QCheckbox>
                        </QCardSection>
                        <div class="row justify-start q-pl-md q-pr-md q-mb-md items-center">
                            <div class="text-subtitle2 title col-2">Profile:</div>
                            <QBtn class="fit-content col-2" color="white" text-color="black" label="Edit" @click="editThcrapProfile"></QBtn>
                            <QSpace></QSpace>
                            <QSelect class="col-7" outlined emit-value map-options dense v-model="gameSettings['thcrapProfile']" :options="thcrapProfiles"></QSelect>
                        </div>
                        <div class="row justify-start q-pl-md q-pr-md q-mb-md items-center">
                            <div class="text-subtitle2 title col-5">Game profile:</div>
                            <QSelect class="col-7" outlined emit-value map-options dense v-model="gameSettings['thcrapGameProfile']" :options="gameProfileOptions"></QSelect>
                        </div>
                        <div class="row justify-start q-pl-md q-pr-md q-mb-md items-center">
                            <div class="text-subtitle2 title col-5">custom.exe profile:</div>
                            <QSelect class="col-7" outlined emit-value map-options dense v-model="gameSettings['thcrapCustomExeProfile']" :options="gameProfileOptions"></QSelect>
                        </div>
                        <div class="row justify-between q-pl-md q-pr-md q-mb-md items-center">
                            <QBtn class="fit-content" color="white" text-color="black" label="Launch game" @click="launchThcrap(false)"></QBtn>
                            <QBtn class="fit-content" color="white" text-color="black" label="Launch custom.exe" @click="launchThcrap(true)"></QBtn>
                        </div>
                        <div class="row justify-between q-pl-md q-pr-md q-mb-md items-center">
                            <QBtn class="fit-content" color="white" text-color="black" label="Set game profiles" @click="editThcrapGameProfiles"></QBtn>
                            <QBtn class="fit-content" color="white" text-color="black" label="Create thcrap profile">
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
                            <div class="text-subtitle2">Wine Settings</div>
                        </QCardSection>
                        <div class="row justify-start q-pa-md items-center"  v-for="(namedPathType, index) in namedPathTypes" :key="index">
                            <div class="text-subtitle2 title col-6">Used Wine{{namedPathType == 'wineExec' ? '' : ' prefix' }}:</div>
                            <QSelect class="col-6" outlined v-model="wineSettings[namedPathType]" :options="wineExecutables[namedPathType]" dense emit-value map-options option-label="label" option-value="value"></QSelect>
                        </div>
                    </QList>
                    <QList bordered class="rounded-borders q-ma-md min-w-500 banner-settings">
                        <QCardSection>
                            <div class="text-subtitle2">Banner settings</div>
                        </QCardSection>
                        <div class="row justify-between q-pl-md q-pr-md items-center">
                            <div class="text-subtitle2 title">Colored banner</div>
                            <QCheckbox v-model="gameSettings['useCustomBanner']" label="Use custom banner"></QCheckbox>
                        </div>
                        <div class="row q-pl-md q-pr-md justify-between">
                            <PostponedInput v-model="gameSettings.banner" class="path-input col-9" :validation-message="gameSettings.bannerCorrect ? '' : 'image not found or incorrect'"></PostponedInput>
                            <QBtn class="col-2 fit-content" color="white" text-color="black" label="Browse" @click="browse(val => { gameSettings.banner = val })"></QBtn>
                        </div>
                        <div class="text-subtitle2 title q-pl-md q-pr-md q-mb-md">Grey banner</div>
                        <div class="row q-pl-md q-pr-md justify-between">
                            <PostponedInput v-model="gameSettings.greyBanner" class="path-input col-9" :validation-message="gameSettings.greyBannerCorrect ? '' : 'image not found or incorrect'"></PostponedInput>
                            <QBtn class="col-2 fit-content" color="white" text-color="black" label="Browse" @click="browse(val => { gameSettings.greyBanner = val })"></QBtn>
                        </div>
                        <div class="row q-pl-md q-pr-md q-pb-md justify-between text-color-settings">
                            <QBtn class="fit-content col-3" color="white" text-color="black" label="Set color" @click="showColorPicker = true"></QBtn>
                            <ColorPicker v-model:color="gameSettings['textColor']" v-model:visible="showColorPicker"></ColorPicker>
                            <div class="color-display col-1" :style="`background-color: ${gameSettings['textColor'] || 'transparent' };`"></div>
                            <QCheckbox class="col-7 justify-end" v-model="gameSettings['useTextColor']" label="Use custom text color"></QCheckbox>
                        </div>
                    </QList>
                    <QList bordered class="rounded-borders q-ma-md min-w-500">
                        <QCardSection>
                            <div class="text-subtitle2">Commands settings</div>
                        </QCardSection>
                        <PostponedInput v-model="gameSettings.commandBefore" label="Command to execute before launch" class="q-ma-md q-mb-lg"></PostponedInput>
                        <PostponedInput v-model="gameSettings.commandAfter" label="Command to execute after launch" class="q-ma-md"></PostponedInput>
                    </QList>
                    <div class="row">
                        <QBtn class="fit-content q-ma-md" color="white" text-color="black" label="Open game folder" @click="openGameFolder"></QBtn>
                        <QBtn class="fit-content q-ma-md" color="white" text-color="black" label="Edit vpatch.ini" @click="editVpatchIni"></QBtn>
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
import { computed, ref } from 'vue';
import { store } from '../store';
import PostponedInput from './PostponedInput.vue';
import { findGamePath } from '@/utils';

const newThcrapProfileNameEdit = ref<QPopupEdit | null>(null);

const emit = defineEmits<
    {(e: 'runGame', isCustomExe: boolean, type?: GameLaunchProfile | CustomExeLaunchProfile): void;
    (e: 'close'): void}
>();
const props = defineProps<{visible: boolean; gameName: GameName; isPC98: boolean}>();
const gameLaunchProfileOptions: SelectOptions<GameLaunchProfile> = [
    { value: 'jp', label: 'Japanese/vpatch.ini' },
    { value: 'en', label: 'English (non-THCRAP)' },
    { value: 'thcrap', label: 'thcrap' }
];
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
const errorTitle = ref('Cannot run thcrap');

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
const wineExecutables = new Proxy({} as Record<NamedPathType, SelectOptions<number>>, {
    get: (_, type: NamedPathType | '__v_isRef') => {
        if (type === '__v_isRef') {
            return false;
        }
        const defaultNamedPath = store.getters.namedPaths(type).find(we => we.id === store.getters.defaultNamedPath(type));
        const defaultNamedPathName = defaultNamedPath ? defaultNamedPath.name : 'None';
        return store.getters.namedPaths(type).map(we => ({
            label: we.name,
            value: we.id
        })).concat([{ label: `(default) ${defaultNamedPathName}`, value: -1 }]);
    }
});

const gameProfileOptions = computed(() => {
    return store.getters.thcrapGameProfiles(props.gameName).map(p => ({ label: p, value: p })).concat([{ label: 'None', value: '' }]);
});

const thcrapProfiles = computed(() => {
    return store.getters.thcrapProfiles.map(p => ({ label: p, value: p })).concat([{ label: 'None', value: '' }]);
});

function checkThcrapGlobalSettings() : boolean {
    if (!store.getters.thcrapFound) {
        thcrapError.value = 'thcrap path is not properly configured';
        errorTitle.value = 'Cannot run thcrap';
        showErrorPopup.value = true;
        return false;
    }
    if (!gameSettings.thcrapProfile) {
        thcrapError.value = 'thcrap profile is not set';
        errorTitle.value = 'Cannot run thcrap';
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
        thcrapError.value = 'thcrap game profile is not set';
        errorTitle.value = 'Cannot run thcrap';
        showErrorPopup.value = true;
        return;
    }
    if (!gameSettings.thcrapCustomExeProfile && isCustomExe) {
        thcrapError.value = 'thcrap custom.exe profile is not set';
        errorTitle.value = 'Cannot run thcrap';
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
    const gamePath = await findGamePathOrShowError('Cannot open game folder');
    if (gamePath) {
        await invokeInMain('open-folder', gamePath);
    }
}
async function editVpatchIni() {
    const gamePath = await findGamePathOrShowError('Cannot find vpatch.ini');
    if (gamePath) {
        await invokeInMain('edit-vpatch', gamePath);
    }
}
async function findGamePathOrShowError(errorToShowTitle: string) : Promise<string | undefined> {
    const gamePath = await findGamePath(props.gameName, store);
    if (gamePath) {
        return gamePath;
    } else {
        thcrapError.value = 'No game\'s executable is configured and no correct game path found in thcrap';
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
