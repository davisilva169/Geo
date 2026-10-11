import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));

function globe(ocean, land) {
  return `
    <circle cx="128" cy="128" r="49" fill="${ocean}"/>
    <g transform="translate(128 128) scale(.49)" clip-path="url(#globe)" fill="${land}">
      <path d="M-96-41c20-24 43-26 65-22l15 19-21 13-3 19-20 14-9 25-20-15-15-23z"/>
      <path d="M-56 13c17-13 37-12 47 2l-8 22-14 18-9 30-16 11-11-27 9-27z"/>
      <path d="M-3-68c30-20 66-19 91 4l13 31-25 10-17-13-22 9-18 17-29-14-17-19z"/>
      <path d="M16-12c23-10 43 3 44 23L43 57 20 76 3 38 2 8z"/>
    </g>`;
}

function marker(x, y, scale, color) {
  return `<g transform="translate(${x} ${y}) scale(${scale})">
    <path d="M0-56c-25 0-45 19-45 44 0 28 27 56 45 76 18-20 45-48 45-76 0-25-20-44-45-44z" fill="${color}"/>
    <circle cy="-12" r="15" fill="#FFFFFF"/>
  </g>`;
}

function svg(title, background, content) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" role="img" aria-labelledby="title">
    <title id="title">${title}</title>
    <defs><clipPath id="globe"><circle r="100"/></clipPath></defs>
    <rect width="256" height="256" rx="50" fill="${background}"/>
    ${content}
  </svg>\n`;
}

const options = [
  [
    "08a-olho-marinho.svg",
    "Olho marinho",
    svg(
      "Olho marinho com globo e marcador",
      "#F7F9F5",
      `<path d="M26 128c28-42 65-64 102-64s74 22 102 64c-28 42-65 64-102 64S54 170 26 128z" fill="#FFFFFF" stroke="#173F52" stroke-width="11" stroke-linejoin="round"/>
      ${globe("#3B9FD8", "#5BC985")}
      ${marker(155, 98, .22, "#F28660")}`,
    ),
  ],
  [
    "08b-olho-turquesa.svg",
    "Olho turquesa",
    svg(
      "Olho turquesa com globo e marcador",
      "#E8F6F1",
      `<path d="M23 128c32-45 69-66 105-66s73 21 105 66c-32 45-69 66-105 66S55 173 23 128z" fill="#FFFFFF"/>
      <path d="M23 128c32-45 69-66 105-66s73 21 105 66" fill="none" stroke="#147D80" stroke-width="15" stroke-linecap="round"/>
      <path d="M23 128c32 45 69 66 105 66s73-21 105-66" fill="none" stroke="#147D80" stroke-width="15" stroke-linecap="round"/>
      ${globe("#378EBE", "#91D56D")}
      ${marker(155, 98, .20, "#F1B94E")}`,
    ),
  ],
  [
    "08c-olho-noturno.svg",
    "Olho noturno",
    svg(
      "Olho noturno com globo e marcador",
      "#12384C",
      `<path d="M23 128c30-42 68-63 105-63s75 21 105 63c-30 42-68 63-105 63S53 170 23 128z" fill="#F6FAF7"/>
      ${globe("#3EAFD7", "#6ACE92")}
      ${marker(156, 99, .21, "#FFBD5A")}`,
    ),
  ],
];

for (const [filename, , content] of options) {
  writeFileSync(join(root, filename), content);
}

const cards = options
  .map(
    ([filename, title], index) => `<article>
      <img class="large" src="${filename}" alt="${title}" />
      <h2>08${"ABC"[index]} · ${title}</h2>
      <div class="small"><img src="${filename}" alt="" />Prévia pequena</div>
    </article>`,
  )
  .join("");

writeFileSync(
  join(root, "index.html"),
  `<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Geo · ícone olho</title><style>
    *{box-sizing:border-box}body{margin:0;padding:32px;background:#f7f5fb;color:#251b39;font:16px/1.5 Arial,sans-serif}main{max-width:960px;margin:auto}h1{margin:0 0 4px;font-size:30px}p{margin:0 0 28px;color:#6f687b}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}article{padding:18px;border:1px solid #e9e3f0;border-radius:18px;background:white}.large{display:block;width:100%;aspect-ratio:1}h2{margin:14px 0 6px;font-size:16px}.small{display:flex;align-items:center;gap:10px;color:#6f687b;font-size:13px}.small img{width:36px;height:36px}@media(max-width:650px){.grid{grid-template-columns:1fr}body{padding:18px}}
  </style></head><body><main><h1>Geo · olho como símbolo</h1><p>Três revisões do conceito 08, sem roxo e com o globo como íris.</p><div class="grid">${cards}</div></main></body></html>`,
);
console.log(`Criadas ${options.length} variações do ícone 08.`);
