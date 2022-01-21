<template>
    <QDialog :modelValue="visible" @update:modelValue="emit('update:visible', false)">
        <QCard style="max-width: none;">
            <QCardSection class="row items-center q-pb-none">
                <div class="text-h6">{{errorTitle}}</div>
                <QSpace></QSpace>
                <QBtn icon="close" flat round dense v-close-popup v-if="showCloseX"></QBtn>
            </QCardSection>
            <QCardSection>
                <div style="white-space: pre;" v-text="error"></div>
            </QCardSection>
            <QCardActions align="right">
                <QBtn flat label="OK" color="primary" v-close-popup></QBtn>
            </QCardActions>
        </QCard>
    </QDialog>
</template>

<script lang="ts" setup>

defineProps<{visible: boolean, showCloseX: boolean, error: string, errorTitle: string}>();
const emit = defineEmits<{(e: 'update:visible', visible: boolean): void}>();

</script>

<style lang="scss" scoped>
</style>
