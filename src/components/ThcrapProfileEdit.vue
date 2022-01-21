<template>
    <QDialog :modelValue="visible" @update:modelValue="closeWin">
        <QCard style="width: 500px;" :class="loading ? 'no-scroll' : ''" ref="mainCard">
            <QCardSection class="row items-center q-pb-none">
                <div class="text-h6">Edit profile</div>
                <QSpace></QSpace>
                <QBtn class="q-mr-md" color="white" text-color="black" label="Save" @click="save"></QBtn>
                <QBtn icon="close" flat round dense v-close-popup></QBtn>
            </QCardSection>
            <QCardSection>
                <QList bordered class="rounded-borders">
                    <QExpansionItem
                    expand-separator
                    label="Selected patches">
                        <QItem
                            tag="label"
                            v-ripple
                            v-for="(patch, index) in selectedPatches"
                            :key="index"
                            draggable="true"
                            @dragstart="ev => onSelectedPatchDragStart(ev, patch.idWithRepo)"
                            @dragover="onSelectedPatchDragOver"
                            @drop="ev => onSelectedPatchDrop(ev, patch.idWithRepo)">
                            <QItemSection side top>
                                <QCheckbox :modelValue="true" @update:modelValue="removeSelectedPatch(index)"></QCheckbox>
                            </QItemSection>

                            <QItemSection>
                                <QItemLabel>{{patch.idWithRepo}}</QItemLabel>
                                <QItemLabel caption>
                                    {{patch.title}}
                                </QItemLabel>
                            </QItemSection>
                        </QItem>
                        <QItem v-if="!selectedPatches.length" class="justify-center items-center">
                            No patches selected.
                        </QItem>
                    </QExpansionItem>
                </QList>
            </QCardSection>
            <QCardSection class="q-pt-none q-pb-none">
                <QInput
                    ref="filterRef"
                    filled
                    v-model="reposFilter"
                    label="Search repositories"
                    >
                    <template v-slot:append>
                        <QIcon v-if="reposFilter !== ''" name="clear" class="cursor-pointer" @click="reposFilter = ''"></QIcon>
                    </template>
                </QInput>
            </QCardSection>
            <QCardSection>
                <QList bordered class="rounded-borders">
                    <QExpansionItem
                        v-for="(repository, index) in repositories" :key="index"
                        v-show="passesFilter(repository)"
                        expand-separator
                        :label="repository.title"
                        :caption="`ID: ${repository.id}`">
                        <QItem tag="label" v-ripple v-for="(patchTitle, patchId) in repository.patches" :key="patchId">
                            <QItemSection side top>
                                <QCheckbox :modelValue="isPatchSelected(repository.id, patchId)" @update:modelValue="val => togglePatch(repository.id, patchId, val)"></QCheckbox>
                            </QItemSection>

                            <QItemSection>
                                <QItemLabel>{{patchId}}</QItemLabel>
                                <QItemLabel caption>
                                    {{patchTitle}}
                                </QItemLabel>
                            </QItemSection>
                        </QItem>
                    </QExpansionItem>
                </QList>
            </QCardSection>
            <QInnerLoading :showing="loading" :style="`top: ${scrollTop}px; bottom: -${scrollTop}px; `">
                <QSpinnerGears size="50px" color="primary"></QSpinnerGears>
            </QInnerLoading>
        </QCard>
    </QDialog>
    <ErrorPopup v-model:visible="showDependencyErrors" :showCloseX="true" :error="dependencyErrors" :errorTitle="`Cannot save ${profileName}`"></ErrorPopup>
</template>

<script lang="ts" setup>
import { ThcrapRepository, ThcrapPatch, ThcrapProfileData, ThcrapPatchResponse, LoadRemoteThcrapPatchParams } from '@/data-types';
import ErrorPopup from './ErrorPopup.vue';
import { defaultThcrapProfileData } from '../constants';
import type { Ref, UnwrapNestedRefs } from '@vue/reactivity';
import { ref, reactive, watch } from 'vue';
import { store } from '../store';
import type { QCard } from 'quasar';

const emit = defineEmits<{(e: 'update:visible', visible: boolean): void; (e: 'saved'): void; }>();

const props = defineProps<{profileName: string; visible: boolean}>();

const repositories: Ref<ThcrapRepository[]> = ref([]);
const selectedPatches: Ref<ThcrapPatch[]> = ref([]);
let profileData: ThcrapProfileData = defaultThcrapProfileData;
const patches: UnwrapNestedRefs<Record<string, ThcrapPatch>> = reactive({});
const loading = ref(true);
const reposFilter = ref('');
const dependencyErrors = ref('');
const showDependencyErrors = ref(false);
const scrollTop = ref(0);
const mainCard: Ref<QCard | null> = ref(null);

watch(() => props.visible, () => {
    if (props.visible) {
        loadAll();
    }
});

async function loadAll() {
    loading.value = true;
    await loadRepositories();
    const profileDataString : string = await invokeInMain('try-load-local-thcrap-profile', store.getters.thcrapPath, props.profileName);
    if (profileDataString) {
        // console.log(`local profile "${props.profileName}" loaded`);
        profileData = JSON.parse(profileDataString);
        // console.log(this.profileData);
        selectedPatches.value.splice(0, selectedPatches.value.length);
        await loadPatchesByPaths(profileData.patches.map(p => p.archive).filter(p => !!p));
    } else {
        // console.log(`local profile "${props.profileName}" is not loaded`);
    }
    loading.value = false;
}

async function loadPatchesByPaths(patchPaths: string[]) {
    for (const patchPath of patchPaths) {
        if (!selectedPatches.value.some(selectedPatch => selectedPatch.path === patchPath)) {
            selectedPatches.value.push(await getPatchData(pathToIdWithRepo(patchPath)));
        }
    }
}

async function getPatchData(idWithRepo: string): Promise<ThcrapPatch> {
    if (patches[idWithRepo]) {
        return patches[idWithRepo];
    }
    const { repoId, patchId } = idWithRepoToRepoAndPatchId(idWithRepo);
    const patchJson: string = await invokeInMain('try-load-local-thcrap-patch', store.getters.thcrapPath, repoId, patchId);
    if (patchJson) {
        const patch = ThcrapPatchFromResponseJson(patchJson, idWithRepo);
        patches[idWithRepo] = patch;
        await loadPatchDependencies(patch, repoId);
        return patch;
    }
    const patchRepository = repositories.value.find(repo => repo.id === repoId);
    if (patchRepository) {
        const patch = await getRemotePatchData(patchRepository, patchId);
        if (patch) {
            patches[idWithRepo] = patch;
            await loadPatchDependencies(patch, repoId);
            return patch;
        }
    }
    return {
        path: constructPatchPath(idWithRepo),
        idWithRepo,
        id: patchId,
        servers: [],
        title: idWithRepo,
        fonts: {}
    };
}

async function loadPatchDependencies(patch: ThcrapPatch, repoId: string) {
    if (patch.dependencies) {
        for (const dependency of patch.dependencies) {
            await getPatchData(constructIdWithRepo(repoId, dependency));
        }
    }
}

async function getRemotePatchData(patchRepository: ThcrapRepository, patchId: string): Promise<ThcrapPatch | null> {
    const params: LoadRemoteThcrapPatchParams = {
        servers: patchRepository.servers,
        patchId
    };
    const patchJson: string = await invokeInMain('try-load-remote-thcrap-patch', JSON.stringify(params));
    if (patchJson) {
        await invokeInMain('save-thcrap-patch-file', store.getters.thcrapPath, patchRepository.id, patchId, patchJson);
        return ThcrapPatchFromResponseJson(patchJson, constructIdWithRepo(patchRepository.id, patchId));
    }
    return null;
}

function ThcrapPatchFromResponseJson(patchJson: string, idWithRepo: string) : ThcrapPatch {
    const patch: ThcrapPatchResponse = JSON.parse(patchJson);
    return {
        ...patch,
        dependencies: patch.dependencies && patch.dependencies.map(dep => fixDependencyStr(dep)),
        path: constructPatchPath(idWithRepo),
        idWithRepo
    };
}

function fixDependencyStr(dependency: string) : string {
    if (dependency.includes('/') && !dependency.endsWith('/')) {
        return dependency + '/';
    }
    return dependency;
}

function idWithRepoToRepoAndPatchId(idWithRepo: string): {repoId: string, patchId: string} {
    const [repoId, patchId] = idWithRepo.replace(/\/$/, '').split('/');
    return { repoId, patchId };
}

function removeSelectedPatch(index: number) {
    selectedPatches.value.splice(index, 1);
}
async function loadRepositories() {
    await loadLocalRepositories();
    for (const repository of repositories.value) {
        if (repository.neighbors) {
            for (const neighbor of repository.neighbors) {
                await loadRepositoryByUrl(neighbor);
            }
        }
    }
    if (store.getters.thcrapStartingRepositoryValid) {
        await loadRepositoryByUrl(store.getters.thcrapStartingRepository);
    }
}
async function loadLocalRepositories() {
    const localRepoStrings : string[] = await invokeInMain('load-local-thcrap-repositories', store.getters.thcrapPath);
    if (localRepoStrings) {
        const repos : ThcrapRepository[] = localRepoStrings.map(s => JSON.parse(s));
        // console.log(repos);
        for (const repo of repos) {
            if (!repositories.value.some(r => r.id === repo.id)) {
                repositories.value.push(repo);
            }
        }
    }
}

async function loadRepositoryByUrl(url: string) {
    if (!isRepositoryLoaded(url)) {
        const repositoryDataJson: string = await invokeInMain('load-thcrap-repository-by-url', url);
        if (repositoryDataJson) {
            const repository : ThcrapRepository = JSON.parse(repositoryDataJson);
            if (!repositories.value.some(r => r.id === repository.id)) {
                repositories.value.push(repository);
            }
            if (repository.neighbors) {
                for (const neighbor of repository.neighbors) {
                    await loadRepositoryByUrl(neighbor);
                }
            }
            await loadRepositoryByUrl(removeLastSegmentFromUrl(url));
            await invokeInMain('save-thcrap-repository-file', store.getters.thcrapPath, repository.id, repositoryDataJson);
        }
    }
}
function isPatchSelected(repoId: string, patchId: string) : boolean {
    const idWithRepo = constructIdWithRepo(repoId, patchId);
    return selectedPatches.value.some(p => p.idWithRepo === idWithRepo);
}
async function togglePatch(repoId: string, patchId: string, value: boolean) {
    const idWithRepo = constructIdWithRepo(repoId, patchId);
    if (!value) {
        const patchIndex = selectedPatches.value.findIndex(p => p.idWithRepo === idWithRepo);
        if (patchIndex >= 0) {
            removeSelectedPatch(patchIndex);
        }
    } else {
        scrollTop.value = mainCard.value ? mainCard.value.$el.scrollTop : 0;
        loading.value = true;
        await addPatchToSelected(repoId, patchId);
        loading.value = false;
    }
}

async function addPatchToSelected(repoId: string, patchId: string) {
    if (!isPatchSelected(repoId, patchId)) {
        const idWithRepo = constructIdWithRepo(repoId, patchId);
        const patch = await getPatchData(idWithRepo);
        if (patch.dependencies) {
            for (const dependency of patch.dependencies) {
                const { repoId: dependencyRepoIp, patchId: dependencyPatchId } = dependency.includes('/') ? idWithRepoToRepoAndPatchId(dependency) : { repoId, patchId: dependency };
                await addPatchToSelected(dependencyRepoIp, dependencyPatchId);
            }
        }
        selectedPatches.value.push(patch);
    }
}

function isRepositoryLoaded(repositoryUrl: string) {
    return repositories.value.some(repo => repo.servers.some(s => s === repositoryUrl));
}
function removeLastSegmentFromUrl(url: string) : string {
    return url.substring(0, url.lastIndexOf('/', url.lastIndexOf('/') - 1) + 1);
}
function constructIdWithRepo(repositoryId: string, patchId: string) {
    return `${repositoryId}/${patchId}/`;
}
function constructPatchPath(idWithRepo: string) : string {
    return `repos/${idWithRepo}`;
}
function pathToIdWithRepo(path: string) : string {
    return path.replace(/^repos\//, '');
}
function closeWin() {
    emit('update:visible', false);
}
function onSelectedPatchDragStart(ev: DragEvent, idWithRepo: string) {
    if (ev.dataTransfer) {
        ev.dataTransfer.setData('text/plain', idWithRepo);
        ev.dataTransfer.dropEffect = 'move';
    }
}
function onSelectedPatchDragOver(ev: DragEvent) {
    ev.preventDefault();
    if (ev.dataTransfer) {
        ev.dataTransfer.dropEffect = 'move';
    }
}
function onSelectedPatchDrop(ev: DragEvent, targetIdWithRepo: string) {
    ev.preventDefault();
    if (ev.dataTransfer) {
        const sourceIdWithRepo = ev.dataTransfer.getData('text/plain');
        const sourcePatchIndex = selectedPatches.value.findIndex(p => p.idWithRepo === sourceIdWithRepo);
        if (selectedPatches.value.some(p => p.idWithRepo === targetIdWithRepo) && sourcePatchIndex >= 0) {
            const sourcePatch = selectedPatches.value.splice(sourcePatchIndex, 1)[0];
            const targetPatchIndex = selectedPatches.value.findIndex(p => p.idWithRepo === targetIdWithRepo);
            selectedPatches.value.splice(targetPatchIndex, 0, sourcePatch);
        }
    }
}
function passesFilter(repository: ThcrapRepository) : boolean {
    return repository.id.toLowerCase().includes(reposFilter.value.toLowerCase()) || repository.title.toLowerCase().includes(reposFilter.value.toLowerCase());
}
function collectDependencyErrors(patch?: ThcrapPatch) : string {
    if (!patch) {
        let errors = '';
        for (const patch of selectedPatches.value) {
            errors += collectDependencyErrors(patch);
        }
        return errors;
    }
    if (patch.dependencies) {
        let errors = '';
        for (let dependency of patch.dependencies) {
            if (!dependency.includes('/')) {
                const { repoId } = idWithRepoToRepoAndPatchId(patch.idWithRepo);
                dependency = constructIdWithRepo(repoId, dependency);
            }
            const dependencyIndexInSelection = selectedPatches.value.findIndex(sp => sp.idWithRepo === dependency);
            const patchIndexInSelection = selectedPatches.value.findIndex(sp => sp.idWithRepo === patch.idWithRepo);
            if (dependencyIndexInSelection === -1) {
                errors += `"${patch.idWithRepo}" depends on "${dependency}" but it is not selected\n`;
            } else if (dependencyIndexInSelection > patchIndexInSelection) {
                errors += `"${patch.idWithRepo}" depends on "${dependency}" but it is lower in the list than "${patch.idWithRepo}"\n`;
            }
        }
        return errors;
    }
    return '';
}
async function save() {
    const collectedDependencyErrors = collectDependencyErrors();
    if (collectedDependencyErrors) {
        dependencyErrors.value = `The profile configuration contains the following errors:\n\n${collectedDependencyErrors}`;
        showDependencyErrors.value = true;
    } else {
        profileData.patches = [];
        for (const selectedPatch of selectedPatches.value) {
            profileData.patches.push({ archive: selectedPatch.path });
        }
        await invokeInMain('save-thcrap-profile', store.getters.thcrapPath, props.profileName, JSON.stringify(profileData, null, '    '));
        emit('saved');
        closeWin();
    }
}
</script>

<style lang="scss" scoped>
.no-scroll {
    pointer-events: none;
}
</style>
