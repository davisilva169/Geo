import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));
const c = {
  violet: "#6840C6",
  deep: "#39246E",
  blue: "#399CD5",
  green: "#60C77D",
  teal: "#33C6B4",
  cream: "#FAF7F0",
  lilac: "#EEE7FB",
  amber: "#FFC655",
  white: "#FFFFFF",
};

const earth = (x, y, radius) => `
  <g transform="translate(${x} ${y}) scale(${radius / 100})">
    <circle r="100" fill="${c.blue}"/>
    <g clip-path="url(#earth-edge)" fill="${c.green}">
      <path d="M-98-45c21-23 46-27 68-22l13 17-18 13-3 20-21 11-10 26-19-11-17-22z"/>
      <path d="M-58 12c17-13 37-13 47 0l-5 25-16 16-9 31-17 12-10-27 8-28z"/>
      <path d="M-5-69c32-19 65-17 91 3l16 31-26 10-16-13-23 9-16 17-30-13-16-19z"/>
      <path d="M17-12c23-8 42 3 43 24L43 57 21 76 4 39 2 8z"/>
      <path d="M67 54c12-6 27-2 35 9l-9 20-28-4z"/>
    </g>
  </g>`;

const pin = (x, y, size, color = c.violet, hole = c.white) => `
  <g transform="translate(${x} ${y}) scale(${size / 100})">
    <path d="M0-92c-38 0-68 29-68 66 0 42 43 84 68 112 25-28 68-70 68-112 0-37-30-66-68-66z" fill="${color}"/>
    <circle cy="-27" r="25" fill="${hole}"/>
  </g>`;

const tile = (title, background, content) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" role="img" aria-labelledby="title">
  <title id="title">${title}</title>
  <defs><clipPath id="earth-edge"><circle r="100"/></clipPath></defs>
  <rect width="256" height="256" rx="50" fill="${background}"/>
  ${content}
</svg>\n`;

const concepts = [
  ["01-globo-pin.svg", "Globo com marcador", c.cream, `
    ${earth(122, 140, 80)}
    ${pin(178, 70, 43)}
  `],
  ["02-pin-mundo.svg", "Mundo dentro do marcador", c.violet, `
    ${pin(128, 130, 102, c.white, c.blue)}
    ${earth(128, 102, 35)}
  `],
  ["03-rota.svg", "Rota ao redor do mundo", c.lilac, `
    ${earth(123, 132, 68)}
    <path d="M42 168c28 31 102 45 159-1" fill="none" stroke="${c.violet}" stroke-width="13" stroke-linecap="round"/>
    <path d="m194 167 17-3-11 14" fill="none" stroke="${c.violet}" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>
    ${pin(180, 63, 32, c.violet)}
  `],
  ["04-horizonte.svg", "Marcador sobre o horizonte", c.violet, `
    <path d="M29 187a99 99 0 0 1 198 0z" fill="${c.blue}"/>
    <path d="M30 187c23-27 41-35 72-33l23 13 39-21 44 15 19 26z" fill="${c.green}"/>
    <path d="M39 187h178" stroke="${c.white}" stroke-width="10" stroke-linecap="round"/>
    ${pin(128, 89, 53, c.amber)}
  `],
  ["05-selo.svg", "Selo do mundo", c.cream, `
    <circle cx="128" cy="130" r="92" fill="${c.violet}"/>
    ${earth(128, 132, 69)}
    ${pin(174, 67, 30, c.amber)}
  `],
  ["06-mapa-pin.svg", "Mapa com marcador", c.lilac, `
    <path d="M37 65 98 51l61 14 60-14v137l-60 16-61-16-61 16z" fill="${c.white}"/>
    <path d="M98 51v137m61-123v139" fill="none" stroke="${c.violet}" stroke-width="6"/>
    ${earth(128, 126, 43)}
    ${pin(172, 90, 29, c.violet)}
  `],
  ["07-mundo-central.svg", "Marcador no centro do mundo", c.violet, `
    ${earth(128, 128, 87)}
    <circle cx="128" cy="128" r="89" fill="none" stroke="${c.white}" stroke-width="7"/>
    ${pin(128, 128, 46, c.white, c.violet)}
  `],
  ["08-geo-g.svg", "G de Geo com planeta", c.cream, `
    <path d="M185 86a79 79 0 1 0 11 68h-64" fill="none" stroke="${c.violet}" stroke-width="21" stroke-linecap="round" stroke-linejoin="round"/>
    ${earth(123, 130, 48)}
    ${pin(174, 76, 25, c.violet)}
  `],
];

for (const [name, title, background, content] of concepts) {
  writeFileSync(join(root, name), tile(title, background, content));
}
const cards = concepts
  .map(
    ([name, title], index) => `
      <article>
        <img class="large" src="${name}" alt="${title}" />
        <h2>${String(index + 1).padStart(2, "0")} · ${title}</h2>
        <div class="small"><img src="${name}" alt="" /><span>Prévia pequena</span></div>
      </article>`,
  )
  .join("");
writeFileSync(
  join(root, "index.html"),
  `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Geo · Globo e descoberta</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 32px; background: #f7f5fb; color: #251b39; font: 16px/1.5 Arial, sans-serif; }
    main { max-width: 1050px; margin: auto; }
    h1 { margin: 0 0 4px; font-size: 30px; }
    p { margin: 0 0 28px; color: #6f687b; }
    .grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 18px; }
    article { padding: 18px; border: 1px solid #e9e3f0; border-radius: 18px; background: white; }
    .large { display: block; width: 100%; aspect-ratio: 1; }
    h2 { margin: 14px 0 6px; font-size: 15px; }
    .small { display: flex; align-items: center; gap: 10px; color: #6f687b; font-size: 13px; }
    .small img { width: 36px; height: 36px; }
    @media (max-width: 850px) { .grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 480px) { body { padding: 18px; } .grid { gap: 10px; } article { padding: 10px; } }
  </style>
</head>
<body>
  <main>
    <h1>Geo · mundo e descoberta</h1>
    <p>Oito opções originais e minimalistas inspiradas na ideia de globo e localização.</p>
    <div class="grid">${cards}</div>
  </main>
</body>
</html>`,
);
console.log(`Criados ${concepts.length} ícones vetoriais.`);
