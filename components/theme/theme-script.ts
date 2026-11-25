export const THEME_STORAGE_KEY = "theme-pref";

export const THEME_COLORS = { light: "#f3ede2", dark: "#16131c" } as const;

/**
 * Runs synchronously in <head> before first paint:
 *  - resolves the theme (no wrong-theme flash) → data-theme, data-theme-pref
 *  - adds .js (enables loader and intro gating in CSS)
 *  - safety net: if hydration never happens, reveal everything after 4s
 */
export const themeScript = `(function(){var d=document.documentElement;d.classList.add('js');var p='system';try{p=localStorage.getItem('${THEME_STORAGE_KEY}')||'system'}catch(e){}if(p!=='light'&&p!=='dark')p='system';var r=p==='system'?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):p;d.setAttribute('data-theme',r);d.setAttribute('data-theme-pref',p);d.style.colorScheme=r;setTimeout(function(){d.classList.add('loader-done','intro-started')},4000)})();`;
