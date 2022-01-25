<i18n lang="json">
{
    "en": {
        "otherGames": "Other Games"
    },
    "ru": {
        "otherGames": "Другие игры"
    },
    "jp": {
        "otherGames": "他のゲーム"
    }
}
</i18n>
<template>
    <QItemLabel header>{{ t('otherGames') }}</QItemLabel>
    <div class="games">
        <Game game-name="stb" :name-color="1"><QImg src="../assets/stb.png"></QImg></Game>
        <Game game-name="ds" :name-color="1"><QImg src="../assets/ds.png"></QImg></Game>
        <Game game-name="gfw" :name-color="10"><QImg src="../assets/gfw.png"></QImg></Game>
        <Game game-name="isc" :name-color="10"><QImg src="../assets/isc.png"></QImg></Game>
        <Game game-name="vd" :name-color="1"><QImg src="../assets/vd.png"></QImg></Game>
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
