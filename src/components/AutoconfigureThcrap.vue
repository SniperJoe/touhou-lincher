<template>
    <QDialog :modelValue="visible" @update:modelValue="closePopup">
        <QCard>
            <QCardSection>
                <div class="text-h6">Configure games? </div>
            </QCardSection>
            <QCardSection>
                If you click "Yes", all Windows games will be automatically configured for running via thcrap.
            </QCardSection>
            <QCardSection>
                <div class="text-subtitle2">thcrap profile: </div>
            </QCardSection>
            <QCardSection>
                <QSelect :options="thcrapProfiles" v-model="thcrapProfile" dense></QSelect>
            </QCardSection>
            <QCardActions align="right">
                <QBtn flat label="Yes" color="primary" @click="config"></QBtn>
                <QBtn flat label="No" color="primary" v-close-popup></QBtn>
            </QCardActions>
        </QCard>
    </QDialog>
</template>

<script lang="ts" setup>
import { ActionTypes } from '@/store/actions';
import { computed, ref } from 'vue';
import { store } from '../store';

defineProps<{visible: boolean}>();

const inputThcrapProfile = ref('');

const thcrapProfiles = computed(() => {
    return store ? store.getters.thcrapProfiles : [];
});
const emit = defineEmits<{(e: 'update:visible', visible: boolean): void}>();
const thcrapProfile = computed({
    get() {
        return inputThcrapProfile.value || thcrapProfiles.value[0] || '';
    },
    set(value: string) {
        inputThcrapProfile.value = value;
    }
});

async function config() {
    await store.dispatch(ActionTypes.CONFIGURE_GAMES_FOR_THCRAP, thcrapProfile.value);
    closePopup();
}

function closePopup() {
    emit('update:visible', false);
}

</script>

<style lang="scss" scoped>
</style>
