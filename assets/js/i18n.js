let currentTranslations = {};
const translationCache = {};

const LANGUAGES = {
    fa: { switchLabel: 'EN', dir: 'rtl' },
    en: { switchLabel: 'FA', dir: 'ltr' }
};

function detectLanguage() {
    const saved = localStorage.getItem('objectscope-lang');
    if (saved && LANGUAGES[saved]) return saved;
    return navigator.language.toLowerCase().startsWith('fa') ? 'fa' : 'en';
}

async function loadTranslations(lang) {
    if (translationCache[lang]) return translationCache[lang];
    try {
        const res = await fetch('assets/i18n/' + lang + '.json');
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        translationCache[lang] = data;
        return data;
    } catch (err) {
        return {};
    }
}

function getNestedValue(obj, pathStr) {
    return pathStr.split('.').reduce((acc, key) => acc && acc[key] ? acc[key] : undefined, obj);
}

function applyTranslations(translations) {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const value = getNestedValue(translations, key);
        if (value) el.textContent = value;
    });
}

async function switchLanguage(lang) {
    if (!LANGUAGES[lang]) return;
    localStorage.setItem('objectscope-lang', lang);
    const html = document.documentElement;
    html.lang = lang;
    html.dir = LANGUAGES[lang].dir;
    currentTranslations = await loadTranslations(lang);
    applyTranslations(currentTranslations);
    const toggle = document.getElementById('lang-toggle');
    if (toggle) toggle.textContent = LANGUAGES[lang].switchLabel;
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: lang } }));
}

function setupLangToggle() {
    const toggle = document.getElementById('lang-toggle');
    if (!toggle) return;
    toggle.addEventListener('click', (e) => {
        e.preventDefault();
        const current = localStorage.getItem('objectscope-lang') || 'en';
        switchLanguage(current === 'fa' ? 'en' : 'fa');
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const lang = detectLanguage();
    switchLanguage(lang);
    setupLangToggle();
});

window.i18n = {
    t: (key) => getNestedValue(currentTranslations, key) || key,
    switch: switchLanguage,
    get lang() { return localStorage.getItem('objectscope-lang') || 'en'; }
};