<template>
    <QList bordered class="rounded-borders q-pa-md q-ma-md">
        <QItem>
            <div class="text-h6">Linux settings</div>
        </QItem>
        <div v-for="(namedPathType, index) in namedPathTypes" :key="index">
            <QTable
                :title="tableTitles[namedPathType]"
                :columns="tablesColumns"
                :rows="tablesRows[namedPathType].value"
                row-key="name"
                binary-state-sort
                :hide-pagination="true"
                :hide-bottom="true"
                selection="multiple"
                v-model:selected="selectedNamedPaths[namedPathType]"
                :rows-per-page-options="[0]"
            >
                <template v-slot:body-cell-name="props">
                    <QTd key="name" :props="props">
                        {{ props.row.name }}
                        <QPopupEdit v-model="props.row.name" v-slot="scope" @save="(val: string) => saveNamedPathName(namedPathType, props.row.id, val)">
                            <QInput v-model="scope.value" dense autofocus counter @keyup.enter="scope.set"></QInput>
                        </QPopupEdit>
                    </QTd>
                </template>
            </QTable>
            <div class="row justify-end q-mt-md">
                <QBtn @click="deleteSelectedNamedPaths(namedPathType)">Delete selected</QBtn>
                <QSpace></QSpace>
                <QBtn @click="pickNamedPath(namedPathType)">{{addBtnLabels[namedPathType]}}</QBtn>
            </div>
            <QItemLabel header>{{defaultNamedPathLabels[namedPathType]}}</QItemLabel>
            <div class="q-pl-md q-pr-md q-mb-md">
                <QSelect v-model="defaultNamedPath[namedPathType]" :options="defaultOptions[namedPathType].value" dense emit-value map-options option-label="name" option-value="id"></QSelect>
            </div>
        </div>
        <QItem>
            <QItemSection><div class="text-h6">Commands settings</div></QItemSection>
        </QItem>
        <PostponedInput v-model="commandBefore" label="Command to execute before every game launch" class="q-ma-md q-mb-lg"></PostponedInput>
        <PostponedInput v-model="commandAfter" label="Command to execute after every game launch" class="q-ma-md" ></PostponedInput>
    </QList>
</template>

<script lang="ts" setup>
import type { QInput, QTableProps } from 'quasar';
import { ActionTypes } from '@/store/actions';
import { NamedPath, NamedPathType, namedPathTypes } from '@/data-types';
import { reactive, computed, ComputedRef } from 'vue';
import { store } from '../store';
import type { UnwrapNestedRefs } from '@vue/reactivity';
import PostponedInput from './PostponedInput.vue';

const tableTitles: Record<NamedPathType, string> = {
    wineExec: 'Wine executables',
    winePrefix: 'Wine Prefixes'
};
const addBtnLabels: Record<NamedPathType, string> = {
    wineExec: 'Add Wine executable',
    winePrefix: 'Add Wine prefix'
};
const defaultNamedPathLabels: Record<NamedPathType, string> = {
    wineExec: 'Default Wine executable',
    winePrefix: 'Default Wine prefix'
};
const tablesColumns: QTableProps['columns'] = [
    {
        name: 'name',
        required: true,
        label: 'Name',
        align: 'left',
        field: 'name',
        sortable: true
    },
    {
        name: 'path',
        align: 'right',
        label: 'Path',
        field: 'path',
        sortable: true
    }
];
const tablesRows: Record<NamedPathType, ComputedRef<NamedPath[]>> = namedPathTypes.reduce((acc: Record<NamedPathType, ComputedRef<NamedPath[]>>, npt: NamedPathType) => {
    acc[npt] = computed(() => store.getters.namedPaths(npt));
    return acc;
}, {} as Record<NamedPathType, ComputedRef<NamedPath[]>>);
const defaultOptions: Record<NamedPathType, ComputedRef<NamedPath[]>> = namedPathTypes.reduce((acc: Record<NamedPathType, ComputedRef<NamedPath[]>>, npt: NamedPathType) => {
    acc[npt] = computed(() => store.getters.namedPaths(npt).concat([{ id: -1, name: 'None', path: '' }]));
    return acc;
}, {} as Record<NamedPathType, ComputedRef<NamedPath[]>>);
const defaultNamedPath = new Proxy({} as Record<NamedPathType, number>, {
    get: (_, name: NamedPathType | '__v_isRef') => {
        if (name === '__v_isRef') {
            return false;
        }
        return store.getters.defaultNamedPath(name);
    },
    set: (_, prop: NamedPathType, value: number) => {
        store.dispatch(ActionTypes.SET_DEFAULT_NAMED_PATH, { type: prop, value });
        return true;
    }
});
const commandBefore = computed({
    get: () => store.getters.commandBefore,
    set: (v: string) => store.dispatch(ActionTypes.SET_COMMAND_BEFORE, v)
});
const commandAfter = computed({
    get: () => store.getters.commandAfter,
    set: (v: string) => store.dispatch(ActionTypes.SET_COMMAND_AFTER, v)
});
const selectedNamedPaths: UnwrapNestedRefs<Record<NamedPathType, NamedPath[]>> = reactive({ wineExec: [], winePrefix: [] });

function saveNamedPathName(type: NamedPathType, id: number, val: string) {
    store.dispatch(ActionTypes.SET_NAMED_PATH_NAME, { name: val, id, type });
}
async function pickNamedPath(type: NamedPathType) {
    const path: string = type === 'wineExec' ? await invokeInMain('pick-linux-exe') : await invokeInMain('pick-folder');
    if (path) {
        store.dispatch(ActionTypes.ADD_NAMED_PATH, {
            type,
            value: {
                path,
                name: type === 'wineExec' ? await getWineName(path) : await getFolderName(path)
            }
        });
    }
}
async function getWineName(path: string) : Promise<string> {
    if (path.includes('Proton')) {
        return path.split('/').find(p => p.includes('Proton')) || 'Proton';
    }
    const wineVersion: string = await invokeInMain('get-wine-version', path);
    return `Wine ${wineVersion}`;
}
async function getFolderName(path: string) : Promise<string> {
    return path.split('/').reverse().find(pp => !!pp) || 'Prefix';
}
async function deleteSelectedNamedPaths(type: NamedPathType) {
    const deletedIds = selectedNamedPaths[type].map(we => we.id);
    await store.dispatch(ActionTypes.DELETE_NAMED_PATHS, { type, value: deletedIds });
    if (deletedIds.includes(defaultNamedPath[type])) {
        defaultNamedPath[type] = -1;
    }
}

</script>

<style lang="scss" scoped>
</style>
