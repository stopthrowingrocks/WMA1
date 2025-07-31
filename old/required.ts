export const rloaded = new Promise((res, rej) => window.addEventListener("load", res));
export const rcss = document.fonts.load("25px Share Tech Mono");
export const rlevels = fetch("src/levels.json").then(data => data.json());
