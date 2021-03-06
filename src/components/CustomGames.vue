<i18n lang="json">
{
    "en": {
        "addCategory": "Add Category",
        "addGame": "Add Game",
        "noCategories": "No categories created.",
        "view": "View",
        "list": "List",
        "details": "Details",
        "largeIcons": "Large icons",
        "smallIcons": "Small icons",
        "tile": "Tile",
        "sort": "Sort",
        "ascending": "Ascending",
        "descending": "Descending",
        "random": "Run random game",
        "game": "Game",
        "path": "Path"
    },
    "ru": {
        "addCategory": "Добавить категорию",
        "addGame": "Добавить игру",
        "noCategories": "Ни одной категории не создано.",
        "view": "Вид",
        "list": "Список",
        "details": "Подробности",
        "largeIcons": "Крупные иконки",
        "smallIcons": "Мелкие иконки",
        "tile": "Плитка",
        "sort": "Сортировка",
        "ascending": "По возрастанию",
        "descending": "По убыванию",
        "random": "Запустить случайную игру",
        "game": "Игра",
        "path": "Путь"
    },
    "jp": {
        "sort": "並べ替え",
        "ascending": "昇順",
        "descending": "降順",
        "view": "表示",
        "tile": "並べて表示",
        "addGame": "ゲームを足す",
        "addCategory": "怪綺談",
        "details": "詳細"
    }
}
</i18n>
<template>
    <QSplitter v-model="splitterModel">
        <template v-slot:before>
            <QTree :nodes="treeNodes" :nodeKey="'id'" :childrenKey="'children'" v-model:selected="selected" ref="tree" :no-nodes-label="t('noCategories')">
                <template v-slot:default-header="props">
                    <CustomGameCategoryHeader :id="props.node.id" :modelValue="props.node.name" :selected="selected == props.node.id"></CustomGameCategoryHeader>
                </template>
            </QTree>
            <div class="row justify-between">
                <QBtn class="q-mt-md q-mb-md q-ml-sm" @click="addCategory">{{ t('addCategory') }}</QBtn>
                <QBtn v-if="canAddGame" class="q-mt-md q-mb-md q-mr-sm" @click="addGame">{{ t('addGame') }}</QBtn>
            </div>
        </template>
        <template v-slot:after>
            <div style="padding-bottom: 80px;" class="q-pa-md">
                <div class="row" v-if="viewType != 'details'" :class="`view-type-${viewType}${order == 'desc' ? ' reverse justify-end' : ''}${viewType == 'list' ? ' column' : ''}`">
                    <CustomGame v-for="(game, index) in games" :index="game.index" :game="game" :key="index" :parentId="selected || 0" :view-type="viewType"></CustomGame>
                </div>
                <QTable
                        v-if="viewType == 'details'"
                        :columns="tableColumns"
                        :rows="games"
                        row-key="index"
                        binary-state-sort
                        :hide-pagination="true"
                        :hide-bottom="true"
                        :rows-per-page-options="[10]"
                        separator="cell"
                        :wrap-cells="true"
                    >
                        <template v-slot:body-cell-game="props">
                            <QTd key="name" :props="props" style="width: fit-content;">
                                <CustomGame :index="props.row.index" :game="toCustomGame(props.row)" :parentId="selected || 0" :view-type="viewType"></CustomGame>
                            </QTd>
                        </template>
                </QTable>
                <QMenu context-menu touch-position>
                    <QItem clickable>
                        <QItemSection>{{ t('view') }}</QItemSection>
                        <QItemSection side>
                            <QIcon name="keyboard_arrow_right"></QIcon>
                        </QItemSection>
                        <QMenu anchor="top end" self="top start">
                            <QList>
                                <QItem>
                                    <QItemSection>
                                        <QCheckbox :modelValue="viewType == 'list'" @update:modelValue="viewType = 'list'" :label="t('list')"></QCheckbox>
                                    </QItemSection>
                                </QItem>
                                <QItem>
                                    <QItemSection>
                                        <QCheckbox :modelValue="viewType == 'details'" @update:modelValue="viewType = 'details'" :label="t('details')"></QCheckbox>
                                    </QItemSection>
                                </QItem>
                                <QItem>
                                    <QItemSection>
                                        <QCheckbox :modelValue="viewType == 'large-icons'" @update:modelValue="viewType = 'large-icons'" :label="t('largeIcons')"></QCheckbox>
                                    </QItemSection>
                                </QItem>
                                <QItem>
                                    <QItemSection>
                                        <QCheckbox :modelValue="viewType == 'small-icons'" @update:modelValue="viewType = 'small-icons'" :label="t('smallIcons')"></QCheckbox>
                                    </QItemSection>
                                </QItem>
                                <QItem>
                                    <QItemSection>
                                        <QCheckbox :modelValue="viewType == 'tile'" @update:modelValue="viewType = 'tile'" :label="t('tile')"></QCheckbox>
                                    </QItemSection>
                                </QItem>
                            </QList>
                        </QMenu>
                    </QItem>
                    <QItem clickable>
                        <QItemSection>{{ t('sort') }}</QItemSection>
                        <QItemSection side>
                            <QIcon name="keyboard_arrow_right"></QIcon>
                        </QItemSection>
                        <QMenu anchor="top end" self="top start">
                            <QList>
                                <QItem>
                                    <QItemSection>
                                        <QCheckbox :modelValue="order == 'asc'" @update:modelValue="order = 'asc'" :label="t('ascending')"></QCheckbox>
                                    </QItemSection>
                                </QItem>
                                <QItem>
                                    <QItemSection>
                                        <QCheckbox :modelValue="order == 'desc'" @update:modelValue="order = 'desc'" :label="t('descending')"></QCheckbox>
                                    </QItemSection>
                                </QItem>
                            </QList>
                        </QMenu>
                    </QItem>
                </QMenu>
            </div>
            <QBtn class="q-ma-md" @click="runRandom" v-if="!!games.length">{{ t('random') }}</QBtn>
        </template>
    </QSplitter>
</template>

<script lang="ts" setup>
import { store } from '@/store';
import { ActionTypes } from '@/store/actions';
import type { LooseDictionary, QTableProps, QTree } from 'quasar';
import { computed, ComputedRef, Ref, ref } from 'vue';
import CustomGameCategoryHeader from './CustomGameCategoryHeader.vue';
import CustomGame from './CustomGame.vue';
import { CustomGame as CustomGameType, CustomGamesViewType } from '../data-types';
import { runCustomGame } from '@/utils';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

const splitterModel = ref(50);
const selected : Ref<number | null> = ref(null);
const tree : Ref<QTree | null> = ref(null);
const canAddGame = computed(() => !!selected.value && store.getters.customGamesCategoryExists(selected.value));

const treeNodes = computed(() => store.getters.customGames);
const order: Ref<'asc' | 'desc'> = ref('asc');

const games : ComputedRef<Array<CustomGameType & {index: number}>> = computed(() => selected.value ? store.getters.customGamesOfCategory(selected.value).map((item, index) => ({ ...item, index })) : []);
const viewType: Ref<CustomGamesViewType> = ref('list');
const tableColumns: ComputedRef<QTableProps['columns']> = computed(() => [
    {
        name: 'game',
        required: true,
        label: t('game'),
        align: 'left',
        field: 'index',
        sortable: true
    },
    {
        name: 'path',
        align: 'right',
        label: t('path'),
        field: 'path',
        sortable: true
    }
]);
async function addCategory() {
    await store.dispatch(ActionTypes.ADD_CUSTOM_GAMES_CATEGORY, selected.value);
    if (selected.value) {
        tree.value && tree.value.setExpanded(selected.value, true);
    }
}
async function addGame() {
    if (selected.value) {
        const path = await invokeInMain('pick-exe');
        if (path) {
            await store.dispatch(ActionTypes.ADD_CUSTOM_GAME, {
                parentId: selected.value,
                game: {
                    name: getExeName(path),
                    path,
                    wineSettings: {
                        wineExec: -1,
                        winePrefix: -1
                    }
                }
            });
        }
    }
}
function toCustomGame(row: LooseDictionary): CustomGameType {
    return row as CustomGameType;
}
function getExeName(path: string) : string {
    const nameMatch = path.match(/[/\\]([^/\\]+)$/);
    if (nameMatch) {
        return nameMatch[1];
    }
    return path;
}
async function runRandom() {
    const index = Math.floor(Math.random() * games.value.length);
    const game = games.value[index];
    if (game) {
        await runCustomGame(game, store, false);
    }
}
</script>

<style lang="scss" scoped>
.view-type-large-icons, .view-type-small-icons, .view-type-tile {
    flex-wrap: wrap;
}
</style>
