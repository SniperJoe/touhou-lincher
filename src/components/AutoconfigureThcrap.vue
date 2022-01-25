<i18n lang="json">
{
    "en": {
        "configureGames": "Configure games?",
        "ifYes": "If you click \"Yes\", all Windows games will be automatically configured for running via thcrap.",
        "yes": "Yes",
        "no": "No",
        "thcrapProfile": "thcrap profile"
    },
    "ru": {
        "configureGames": "Настроить игры?",
        "ifYes": "При нажатии \"Да\" все Windows-игры будут автоматически настроены для запуска через thcrap.",
        "yes": "Да",
        "no": "Нет",
        "thcrapProfile": "Профиль thcrap"
    }
}
</i18n>

<template>
    <QDialog :modelValue="visible" @update:modelValue="closePopup">
        <QCard>
            <QCardSection>
                <div class="text-h6">{{ t('configureGames') }} </div>
            </QCardSection>
            <QCardSection>
                {{ t('ifYes') }}
            </QCardSection>
            <QCardSection>
                <div class="text-subtitle2">{{ t('thcrapProfile') }}: </div>
            </QCardSection>
            <QCardSection>
                <QSelect :options="thcrapProfiles" v-model="thcrapProfile" dense></QSelect>
            </QCardSection>
            <QCardActions align="right">
                <QBtn flat :label="t('yes')" color="primary" @click="config"></QBtn>
                <QBtn flat :label="t('no')" color="primary" v-close-popup></QBtn>
            </QCardActions>
        </QCard>
    </QDialog>
</template>

<script lang="ts" setup>
import { ActionTypes } from '@/store/actions';
import { computed, ref } from 'vue';
import { store } from '../store';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

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
