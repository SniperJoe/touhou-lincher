<i18n lang="json">
{
    "en": {
        "mainGames": "Main Games"
    },
    "ru": {
        "mainGames": "Основные игры"
    }
}
</i18n>
<template>
    <QItemLabel header>{{ t('mainGames') }}</QItemLabel>
    <div class="games">
        <Game game-name="hrtp" :name-color="9"><QImg class="system-banner" src="../assets/hrtp.png"></QImg></Game>
        <Game game-name="soew" :name-color="5"><QImg src="../assets/soew.png"></QImg></Game>
        <Game game-name="podd" :name-color="1"><QImg src="../assets/podd.png"></QImg></Game>
        <Game game-name="lls" :name-color="10"><QImg src="../assets/lls.png"></QImg></Game>
        <Game game-name="ms" :name-color="5"><QImg src="../assets/ms.png"></QImg></Game>
        <Game game-name="eosd" :name-color="3"><QImg src="../assets/eosd.png"></QImg></Game>
        <Game game-name="pcb" :name-color="2"><QImg src="../assets/pcb.png"></QImg></Game>
        <Game game-name="in" :name-color="1"><QImg src="../assets/in.png"></QImg></Game>
        <Game game-name="pofv" :name-color="1"><QImg src="../assets/pofv.png"></QImg></Game>
        <Game game-name="mof" :name-color="1"><QImg src="../assets/mof.png"></QImg></Game>
        <Game game-name="sa" :name-color="1"><QImg src="../assets/sa.png"></QImg></Game>
        <Game game-name="ufo" :name-color="1"><QImg src="../assets/ufo.png"></QImg></Game>
        <Game game-name="td" :name-color="1"><QImg src="../assets/td.png"></QImg></Game>
        <Game game-name="ddc" :name-color="1"><QImg src="../assets/ddc.png"></QImg></Game>
        <Game game-name="lolk" :name-color="10"><QImg src="../assets/lolk.png"></QImg></Game>
        <Game game-name="hsifs" :name-color="10"><QImg src="../assets/hsifs.png"></QImg></Game>
        <Game game-name="wbawc" :name-color="10"><QImg src="../assets/wbawc.png"></QImg></Game>
        <Game game-name="um" :name-color="1"><QImg src="../assets/um.png"></QImg></Game>
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
