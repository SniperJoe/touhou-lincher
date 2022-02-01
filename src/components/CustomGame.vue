<i18n lang="json">
{
    "en": {
        "winePrefix": "Wine Prefix",
        "openFolder": "Open folder",
        "openWithAppLocale": "Open with AppLocale",
        "delete": "Delete",
        "rename": "Rename",
        "deleteConfirm": "Are you sure you want to delete \"{name}\" from {categoryName}?"
    },
    "ru": {
        "winePrefix": "Префикс Wine",
        "openFolder": "Открыть каталог",
        "openWithAppLocale": "Открыть с AppLocale",
        "delete": "Удалить",
        "rename": "Переименовать",
        "deleteConfirm": "Вы уверены, что хотите удалить \"{name}\" из {categoryName}?"
    },
    "jp": {
        "deleteConfirm": "{name}を消すか？"
    }
}
</i18n>

<template>
    <div class="row items-center custom-game" :class="viewClass[viewType]" @dblclick="run(false)">
        <QImg :src="img" :width="iconWidth[viewType]"></QImg>
        <span class="game-name" v-if="viewType != 'tile'">{{ game.name }}</span>
        <div class="tile-details" v-if="viewType == 'tile'">
            <div class="game-name">
                {{ game.name }}
                <QTooltip anchor="top middle" self="bottom middle">{{ game.name }}</QTooltip>
            </div>
            <div class="game-path">
                {{ game.path }}
                <QTooltip anchor="top middle" self="bottom middle">{{ game.path }}</QTooltip>
            </div>
        </div>
        <QPopupEdit v-if="showEditPopup" :modelValue="props.game.name" v-slot="scope" @save="setName" ref="editPopup" @hide="hideEdit">
            <QInput v-model="scope.value" dense autofocus counter @keyup.enter="scope.set"></QInput>
        </QPopupEdit>
        <QMenu context-menu touch-position>
            <QItem clickable>
                <QItemSection>{{ t('winePrefix') }}</QItemSection>
                <QItemSection side>
                    <QIcon name="keyboard_arrow_right"></QIcon>
                </QItemSection>
                <QMenu anchor="top end" self="top start">
                    <QList>
                        <QItem v-for="(prefix, index) in prefixes" :key="index">
                            <QItemSection>
                                <QCheckbox :modelValue="game.wineSettings.winePrefix == prefix.id" @update:modelValue="setPrefix(prefix.id)" :label="prefix.name"></QCheckbox>
                            </QItemSection>
                        </QItem>
                    </QList>
                </QMenu>
            </QItem>
            <QItem clickable>
                <QItemSection>Wine</QItemSection>
                <QItemSection side>
                    <QIcon name="keyboard_arrow_right"></QIcon>
                </QItemSection>
                <QMenu anchor="top end" self="top start">
                    <QList>
                        <QItem v-for="(wine, index) in wines" :key="index">
                            <QItemSection>
                                <QCheckbox :modelValue="game.wineSettings.wineExec == wine.id" @update:modelValue="setWine(wine.id)" :label="wine.name"></QCheckbox>
                            </QItemSection>
                        </QItem>
                    </QList>
                </QMenu>
            </QItem>
            <QItem clickable v-close-popup @click="openFolder">
                <QItemSection>{{ t('openFolder') }}</QItemSection>
            </QItem>
            <QItem clickable v-close-popup @click="run(true)">
                <QItemSection>{{ t('openWithAppLocale') }}</QItemSection>
            </QItem>
            <QItem clickable v-close-popup @click="deleteGame">
                <QItemSection>{{ t('delete') }}</QItemSection>
            </QItem>
            <QItem clickable v-close-popup @click="renameGame">
                <QItemSection>{{ t('rename') }}</QItemSection>
            </QItem>
        </QMenu>
    </div>
</template>

<script lang="ts" setup>
import { CustomGame, CustomGamesViewType } from '@/data-types';
import { store } from '@/store';
import { ActionTypes } from '@/store/actions';
import { computed, ComputedRef, nextTick, Ref, ref, watch } from 'vue';
import { QPopupEdit, useQuasar } from 'quasar';
import { runCustomGame } from '@/utils';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

const props = defineProps<{index: number; game: CustomGame; parentId: number; viewType: CustomGamesViewType}>();
const img = ref('');
const $q = useQuasar();
const showEditPopup = ref(false);
const editPopup: Ref<QPopupEdit | null> = ref(null);
const viewClass: ComputedRef<Record<CustomGamesViewType, string>> = computed(() => ({
    details: 'no-wrap',
    list: 'custom-game-list',
    'large-icons': 'column custom-game-large-icons',
    'small-icons': 'column custom-game-small-icons',
    tile: 'custom-game-tile'
}));
const iconWidth: ComputedRef<Record<CustomGamesViewType, string>> = computed(() => ({
    details: '48px',
    list: '24px',
    'large-icons': '96px',
    'small-icons': '48px',
    tile: '48px'
}));

async function loadImg() {
    img.value = await invokeInMain('load-img-from-exe', props.game.path);
    invokeInMain('log', 'got img: ' + img.value);
}
watch(() => props.game.path, loadImg);
const prefixes = computed(() => store.getters.namedPaths('winePrefix').concat({ id: -1, name: 'Default', path: '' }));
const wines = computed(() => store.getters.namedPaths('wineExec').concat({ id: -1, name: 'Default', path: '' }));
function setPrefix(prefixId: number) {
    const game = props.game;
    game.wineSettings.winePrefix = prefixId;
    store.dispatch(ActionTypes.EDIT_CUSTOM_GAME, { parentId: props.parentId, game, index: props.index });
}
function setWine(wineId: number) {
    const game = props.game;
    game.wineSettings.wineExec = wineId;
    store.dispatch(ActionTypes.EDIT_CUSTOM_GAME, { parentId: props.parentId, game, index: props.index });
}
async function openFolder() {
    await invokeInMain('open-folder', props.game.path);
}
async function run(withAppLocale: boolean) {
    await runCustomGame(props.game, store, withAppLocale);
}
function deleteGame() {
    $q.dialog({
        message: t('deleteConfirm', { name: props.game.name, categoryName: store.getters.customGamesCategoryName(props.parentId) }),
        cancel: true,
        persistent: true
    }).onOk(() => {
        store.dispatch(ActionTypes.DELETE_CUSTOM_GAME, props);
    });
}
function setName(newVal: string) {
    const game = props.game;
    game.name = newVal;
    store.dispatch(ActionTypes.EDIT_CUSTOM_GAME, { parentId: props.parentId, game, index: props.index });
}
function hideEdit() {
    showEditPopup.value = false;
}
function renameGame() {
    showEditPopup.value = true;
    nextTick(() => {
        editPopup.value && editPopup.value.show();
    });
}
loadImg();
</script>

<style lang="scss" scoped>
.custom-game {
    gap: 10px;
    cursor: default;
    &.custom-game-list {
        gap: 5px;
    }
    &.custom-game-large-icons {
        width: 144px;
        text-align: center;
    }
    &.custom-game-small-icons {
        width: 83px;
        text-align: center;
    }
    &.custom-game-tile {
        width: 200px;
        .tile-details {
            width: 71%;
            .game-path, .game-name {
                width: 100%;
                text-overflow: ellipsis;
                white-space: nowrap;
                overflow: hidden;
            }
        }
    }
    .game-name {
        user-select: none;
    }
}
</style>
