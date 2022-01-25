<i18n lang="json">
{
    "en": {
        "delete": "Are you sure you want to delete category {name} and all it's contents?",
        "cancel": "Cancel",
        "ok": "OK"
    },
    "ru": {
        "delete": "Вы уверены, что хотите удалить категорию {name} и всё её содержимое?",
        "cancel": "Отмена",
        "ok": "OK"
    }
}
</i18n>

<template>
    <div class="row items-center">
        {{ modelValue }}
        <QPopupEdit v-if="showEditPopup" :modelValue="modelValue" v-slot="scope" @save="setName" ref="editPopup" @hide="hideEdit">
            <QInput v-model="scope.value" dense autofocus counter @keyup.enter="scope.set"></QInput>
        </QPopupEdit>
        <QIcon class="q-ml-sm" name="edit" @click="showEdit"></QIcon>
        <QIcon class="q-ml-sm" name="delete" @click="remove"></QIcon>
    </div>
</template>

<script lang="ts" setup>
import { store } from '@/store';
import { ActionTypes } from '@/store/actions';
import { QPopupEdit, useQuasar } from 'quasar';
import { ref, Ref } from 'vue';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

const props = defineProps<{id: number, modelValue: string, selected?: boolean}>();
const editPopup: Ref<QPopupEdit | null> = ref(null);
const showEditPopup = ref(false);
const $q = useQuasar();

function setName(newVal: string) {
    store.dispatch(ActionTypes.SET_CUSTOM_GAMES_CATEGORY_NAME, { id: props.id, name: newVal });
}
function showEdit() {
    showEditPopup.value = true;
    editPopup.value && editPopup.value.show();
}
function hideEdit() {
    showEditPopup.value = false;
}
function remove() {
    $q.dialog({
        message: t('delete', { name: props.modelValue }),
        cancel: t('cancel'),
        persistent: true
    }).onOk(() => {
        store.dispatch(ActionTypes.DELETE_CUSTOM_GAMES_CATEGORY, props.id);
    });
}
</script>

<style lang="scss" scoped>
.dark {
    background-color: gray;
}
</style>
