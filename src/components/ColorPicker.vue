<template>
    <QDialog :modelValue="visible" @update:modelValue="emit('update:visible', false)">
        <QCard>
            <QColor :format-model="'hex'" :modelValue="color" @change="val => emit('update:color', val)"></QColor>
        </QCard>
    </QDialog>
</template>

<script lang="ts" setup>
defineProps<{color: string, visible: boolean}>();
const emit = defineEmits<
    {(e: 'update:color', newColor: string): void;
    (e: 'update:visible', visible: boolean): void;
}>();
</script>

<style lang="scss" scoped>
</style>
