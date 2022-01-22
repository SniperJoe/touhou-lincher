<template>
    <div class="row controls" ref="row">
        <QBtn style="height: fit-content;" @click="openRepository('http://replay.lunarcast.net')">replay.lunarcast.net</QBtn>
        <QBtn style="height: fit-content;" @click="openRepository('https://maribelhearn.com/gensokyo')">maribelhearn.com/gensokyo</QBtn>
        <PostponedInput style="width: 300px;" :model-value="repository" @update:model-value="setRepository"></PostponedInput>
    </div>
</template>

<script lang="ts" setup>
import { Ref, ref } from 'vue';
import PostponedInput from './PostponedInput.vue';

const row: Ref<HTMLDivElement | null> = ref(null);
const repository = ref('');

function setRepository(newVal: string) {
    repository.value = newVal;
    openRepository(newVal);
}
async function openRepository(url: string) {
    url = /^https?:\/\//.test(url) ? url : `https://${url}`;
    await invokeInMain('open-replays-repository', url, row.value ? row.value.getBoundingClientRect().top + row.value.getBoundingClientRect().height : 100);
}
</script>

<style lang="scss" scoped>
.controls {
    gap: 10px;
}
</style>
