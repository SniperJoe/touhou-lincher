<template>
    <QList bordered padding class="rounded-borders q-mb-md">
        <MainGames></MainGames>
    </QList>
    <QList bordered padding class="rounded-borders q-mb-md">
        <FightingGames></FightingGames>
    </QList>
    <QList bordered padding class="rounded-borders">
        <OtherGames></OtherGames>
    </QList>
    <RandomGameBtn></RandomGameBtn>
</template>

<script lang="ts" setup>
import MainGames from './MainGames.vue';
import FightingGames from './FightingGames.vue';
import OtherGames from './OtherGames.vue';
import RandomGameBtn from './RandomGameBtn.vue';

</script>
