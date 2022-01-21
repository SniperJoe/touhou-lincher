<template>
    <QDialog :modelValue="visible" @update:modelValue="closeWin">
        <QCard style="width: 500px;" :class="loading ? 'no-scroll' : ''">
            <QCardSection class="row items-center q-pb-none">
                <div class="text-h6">Edit profile</div>
                <QSpace></QSpace>
                <QBtn class="q-mr-md" color="white" text-color="black" label="Save" @click="save"></QBtn>
                <QBtn icon="close" flat round dense v-close-popup></QBtn>
            </QCardSection>
            <QCardSection>
                <QTable
                    :title="'Edit thcrap game profiles'"
                    :columns="tablesColumns"
                    :rows="profiles"
                    row-key="name"
                    binary-state-sort
                    :hide-pagination="true"
                    :hide-bottom="true"
                    selection="multiple"
                    v-model:selected="selectedProfiles"
                    :rows-per-page-options="[10]"
                >
                    <template v-slot:body-cell-name="props">
                        <QTd key="name" :props="props">
                            {{ props.row.name }}
                            <QPopupEdit v-model="props.row.name" v-slot="scope">
                                <QInput v-model="scope.value" dense autofocus counter @keyup.enter="scope.set"></QInput>
                            </QPopupEdit>
                        </QTd>
                    </template>
                    <template v-slot:body-cell-path="props">
                        <QTd key="path" :props="props">
                            {{ props.row.path }}
                            <QPopupEdit v-model="props.row.path" v-slot="scope">
                                <QInput v-model="scope.value" dense autofocus counter @keyup.enter="scope.set"></QInput>
                            </QPopupEdit>
                        </QTd>
                    </template>
                </QTable>
                <div class="row justify-end q-mt-md">
                    <QBtn @click="deleteProfiles">Delete selected</QBtn>
                    <QSpace></QSpace>
                    <QBtn @click="addProfile">Add game profile</QBtn>
                </div>
            </QCardSection>
        </QCard>
    </QDialog>
</template>

<script lang="ts" setup>
import type { QTableProps } from 'quasar';
import type { Ref } from '@vue/reactivity';
import { ref, watch } from 'vue';
import { store } from '../store';

const props = defineProps<{visible: boolean}>();
const emit = defineEmits<{(e: 'update:visible', visible: boolean): void; (e: 'saved'): void; }>();
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
const selectedProfiles: Ref<{name: string, path: string, id: number}[]> = ref([]);
const profiles: Ref<{name: string, path: string, id: number}[]> = ref([]);
const loading = ref(true);

async function onVisibleChanged() {
    if (props.visible) {
        loading.value = true;
        const profilesStr = await invokeInMain('load-thcrap-game-profiles', store.getters.thcrapPath);
        if (profilesStr) {
            const profilesObj: Record<string, string> = JSON.parse(profilesStr);
            profiles.value = Object.keys(profilesObj).map((k, index) => ({ name: k, path: profilesObj[k], id: index }));
        }
        loading.value = false;
    }
}
watch(() => props.visible, onVisibleChanged);

function deleteProfiles() {
    profiles.value = profiles.value.filter(p => !selectedProfiles.value.some(sp => sp.id === p.id));
}

function addProfile() {
    profiles.value.push({ name: 'New profile', path: 'New profile path', id: profiles.value.length });
}
function closeWin() {
    emit('update:visible', false);
}
async function save() {
    const profilesObj = profiles.value.reduce((acc: Record<string, string>, current) => {
        acc[current.name] = current.path;
        return acc;
    }, {});
    await invokeInMain('save-thcrap-game-profiles', store.getters.thcrapPath, JSON.stringify(profilesObj, null, '    '));
    emit('saved');
    closeWin();
}

</script>

<style lang="scss" scoped>
</style>
