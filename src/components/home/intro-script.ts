/**
 * Runs in the document before first paint (root layout) and decides whether
 * home/HomeIntro plays, so the black screen is there from the first frame instead of flashing
 * the page. Kept tiny and dependency-free; storage can throw.
 */
export const INTRO_SCRIPT = `try{var d=document.documentElement,f=/[?&]intro\\b/.test(location.search);if(location.pathname==="/"&&!matchMedia("(prefers-reduced-motion: reduce)").matches&&(f||(!navigator.webdriver&&!sessionStorage.getItem("htf:intro")))){d.dataset.intro="play";sessionStorage.setItem("htf:intro","1")}}catch(e){}`;
