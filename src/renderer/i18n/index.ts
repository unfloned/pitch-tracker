import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { en } from './en';
import { de } from './de';

export type Language = 'en' | 'de';

const LANGUAGE_STORAGE_KEY = 'simple-tracker-language';

function getInitialLanguage(): Language {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored === 'de' || stored === 'en') return stored;
    const browser = navigator.language.toLowerCase();
    return browser.startsWith('de') ? 'de' : 'en';
}

export function setLanguage(lang: Language): void {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    i18n.changeLanguage(lang);
}

export function getLanguage(): Language {
    return (i18n.language as Language) ?? 'en';
}

i18n.use(initReactI18next).init({
    resources: {
        en: { translation: en },
        de: { translation: de },
    },
    lng: getInitialLanguage(),
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
});

export default i18n;
