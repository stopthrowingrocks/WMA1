const d = document;
const rloaded = new Promise((res, rej) => window.addEventListener("load", res));
const rcss = d.fonts.load("25px Share Tech Mono");
const rlevels = fetch("src/levels.json").then(data => data.json());
