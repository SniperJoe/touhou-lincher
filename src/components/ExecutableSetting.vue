<i18n lang="json">
{
    "en": {
        "pathUnset": "The path is not set.",
        "cannotRun": "Cannot run {title}",
        "withApplocale": "With Applocale",
        "jp": "Japanese/vpatch executable",
        "en": "English executable",
        "custom": "Custom.exe",
        "pc98": "Game HDI",
        "browse": "Browse",
        "launch": "Launch"
    },
    "ru": {
        "pathUnset": "Путь не настроен.",
        "cannotRun": "Невозмо {title}",
        "withApplocale": "Запуск с Applocale",
        "jp": "Японский/vpatch",
        "en": "Английский",
        "custom": "Custom.exe",
        "pc98": "HDI образ игры",
        "browse": "Обзор",
        "launch": "Запуск"
    }
}
</i18n>
<template>
    <div class="executable-settings q-pa-md">
        <div class="row justify-between">
            <div class="text-subtitle2 title">{{title}}:</div>
            <QCheckbox v-if="type != 'pc98'" :modelValue="withAppLocale" @update:modelValue="updateWithAppLocale" :label="t('withApplocale')"></QCheckbox>
        </div>
        <div class="row justify-between">
            <PostponedInput class="path-input col-7 q-pb-none" v-model="path" :show-toolip="true"></PostponedInput>
            <QBtn class="col-2 fit-content" color="white" text-color="black" :label="t('browse')" @click="browse"></QBtn>
            <QBtn class="col-2 fit-content" color="white" text-color="black" :label="t('launch')" @click="launch"></QBtn>
        </div>
    </div>
    <ErrorPopup v-model:visible="showError" :showCloseX="true" :error="t('pathUnset')" :errorTitle="t('cannotRun', {title})"></ErrorPopup>
</template>

<script lang="ts" setup>
import { ConfigurableExecutable, ConfigurableFile, GameName } from '../data-types';
import { ActionTypes } from '@/store/actions';
import ErrorPopup from './ErrorPopup.vue';
import { computed, ref } from 'vue';
import { store } from '../store';
import PostponedInput from './PostponedInput.vue';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

const props = withDefaults(defineProps<{type: ConfigurableFile, gameName: GameName}>(), {
    type: 'jp'
});
const emit = defineEmits<{(e: 'runGame'): void}>();

const title = computed(() => t(props.type));
const path = computed({
    get: () => {
        return isExecutable(props.type) ? store.getters.gameSettings(props.gameName).executables[props.type].path : store.getters.gameSettings(props.gameName).hdiPath;
    },
    set: (val: string) => {
        invokeInMain('log', 'Setting path of ' + title.value + ': ' + val);
        const gameSettings = store.getters.gameSettings(props.gameName);
        if (isExecutable(props.type)) {
            gameSettings.executables[props.type].path = val;
        } else {
            gameSettings.hdiPath = val;
        }
        store.dispatch(ActionTypes.SET_GAME_SETTINGS, { ...gameSettings, gameName: props.gameName });
    }
});
const withAppLocale = computed(() => isExecutable(props.type) ? store.getters.gameSettings(props.gameName).executables[props.type].withAppLocale : false);
const showError = ref(false);

function updateWithAppLocale() {
    if (isExecutable(props.type)) {
        const gameSettings = store.getters.gameSettings(props.gameName);
        gameSettings.executables[props.type].withAppLocale = !gameSettings.executables[props.type].withAppLocale;
        store.dispatch(ActionTypes.SET_GAME_SETTINGS, { ...gameSettings, gameName: props.gameName });
    }
}
function isExecutable(type: ConfigurableFile): type is ConfigurableExecutable {
    return type !== 'pc98';
}

async function browse() {
    const browsedPath: string = props.type === 'pc98' ? await invokeInMain('pick-hdi') : await invokeInMain('pick-exe');
    if (browsedPath) {
        path.value = browsedPath;
    }
}

async function launch() {
    if (path.value) {
        emit('runGame');
    } else {
        showError.value = true;
    }
}

</script>

<style lang="scss" scoped>
    .title {
        align-items: center;
        display: flex;
    }
    .executable-settings {
        .path-input-row {
            gap: 10px;
        }
    }
</style>
