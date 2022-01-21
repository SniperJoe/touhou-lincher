<template>
    <QInput outlined v-model="inputted" :rules="[() => validationMessage || true]" dense type="text" :label="label" @keypress.enter="blurInput" @blur="update" ref="input">
        <QTooltip anchor="top middle" self="bottom middle" v-if="showToolip && !!inputted">{{inputted}}</QTooltip>
    </QInput>
</template>

<script lang="ts" setup>
import { onBeforeUnmount, onMounted, Ref, ref, watch } from 'vue';
import type { QInput } from 'quasar';

const props = defineProps<{showToolip?: boolean; modelValue: string; label?: string; validationMessage?: string}>();
const input : Ref<QInput | null> = ref(null);
const emit = defineEmits<{(e: 'update:modelValue', value: string): void}>();
const inputted = ref('');

function blurInput() {
    input.value && input.value.blur();
}
function update() {
    if (props.modelValue !== inputted.value) {
        emit('update:modelValue', inputted.value);
    }
}
watch(() => props.modelValue, () => {
    if (props.modelValue !== inputted.value) {
        inputted.value = props.modelValue;
    }
});
watch(() => props.validationMessage, () => {
    input.value && input.value.validate();
});
onMounted(() => {
    inputted.value = props.modelValue;
});
onBeforeUnmount(() => {
    update();
});
</script>

<style lang="scss" scoped>

</style>
