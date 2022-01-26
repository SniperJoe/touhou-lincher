<i18n lang="json">
{
    "en": {
        "copy": "Copy link"
    },
    "ru": {
        "copy": "Копировать ссылку"
    }
}
</i18n>

<template>
    <a href="#" @click="openLink">
    <slot></slot>
    <QMenu context-menu touch-position>
        <QItem clickable v-close-popup @click="copyLink">
            <QItemSection>{{ t('copy') }}</QItemSection>
        </QItem>
    </QMenu>
    </a>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

const props = defineProps<{link: string}>();

async function openLink(e: MouseEvent): Promise<void> {
    console.log('opening link');
    e.preventDefault();
    await invokeInMain('open-link', props.link);
}
function copyLink() {
    navigator.clipboard.writeText(props.link);
}
</script>

<style lang="scss" scoped>

</style>
