import { SupportedLang } from "./data-types";

export const mainProcessTranslations: Record<string, Record<SupportedLang, string>> = {
    downloadPatch: {
        en: `Download %url% to %path%?`,
        ru: `Сохранить %url% как %path%?`,
        jp: ''
    },
    cancel: {
        en: 'Cancel',
        ru: 'Отмена',
        jp: ''
    },
    saveAs: {
        en: 'Save as...',
        ru: 'Сохранить как...',
        jp: ''
    },
    customGames: {
        en: 'Custom Games',
        ru: 'Свои игры',
        jp: ''
    },
    random: {
        en: 'Random',
        ru: 'Запустить случайно',
        jp: ''
    },
    open: {
        en: 'Open',
        ru: 'Открыть',
        jp: ''
    },
    exit: {
        en: 'Exit',
        ru: 'Выйти',
        jp: ''
    }
}