<i18n lang="json">
{
    "en": {
        "random": "Random"
    },
    "ru": {
        "random": "Случайная"
    },
    "jp": {
        "random": "漫然"
    }
}
</i18n>
<template>
    <QCard class="shadow-transition game-card" :class="hovered ? 'shadow-6' : 'shadow-3'" @mouseenter="hovered = true" @mouseleave="hovered = false" @click="launch">
        <QImg src="../assets/random.png"></QImg>
        <div
            class="absolute-full text-left game-title text-weight-medium">
          {{ t('random') }}
        </div>
    </QCard>
</template>

<script lang="ts" setup>
import { store } from '@/store';
import { runRandomGame } from '@/utils';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

const hovered = ref(false);
async function launch() {
    await runRandomGame(store);
}
</script>

<style lang="scss" scoped>
@import '../styles/quasar.scss';
.game-card {
    overflow: hidden;
    cursor: pointer;
    width: 25%;
    margin: 20px auto;
    .game-title {
        color: $grey-1;
    }
}
</style>
