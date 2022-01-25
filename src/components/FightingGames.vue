<i18n lang="json">
{
    "en": {
        "fightingGames": "Fighting Games"
    },
    "ru": {
        "fightingGames": "Файтинги"
    },
    "jp": {
        "fightingGames": "格闘ゲーム"
    }
}
</i18n>

<template>
    <QItemLabel header>{{ t('fightingGames') }}</QItemLabel>
    <div class="games">
        <Game game-name="iamp" :name-color="1"><QImg src="../assets/iamp.png"></QImg></Game>
        <Game game-name="swr" :name-color="1"><QImg src="../assets/swr.png"></QImg></Game>
        <Game game-name="soku" :name-color="1"><QImg src="../assets/soku.png"></QImg></Game>
        <Game game-name="hm" :name-color="1"><QImg src="../assets/hm.png"></QImg></Game>
        <Game game-name="ulil" :name-color="1"><QImg src="../assets/ulil.png"></QImg></Game>
        <Game game-name="aocf" :name-color="1"><QImg src="../assets/aocf.png"></QImg></Game>
    </div>
</template>

<script lang="ts" setup>
import Game from './Game.vue';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

</script>

<style lang="scss">
.games {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    margin: auto 10px;
}
</style>
