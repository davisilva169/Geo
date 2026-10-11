import { readdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
async function files(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((e) =>
      e.isDirectory()
        ? files(path.join(dir, e.name))
        : [path.join(dir, e.name)],
    ),
  );
  return nested.flat();
}
const paths = (await files("dist")).filter((p) => !p.endsWith("sw.js"));
const list = paths.map(
  (p) => "./" + path.relative("dist", p).split(path.sep).join("/"),
);
const hash = createHash("sha256");
for (const p of paths) hash.update(await readFile(p));
const version = "geo-" + hash.digest("hex").slice(0, 12);
const worker = [
  "const CACHE=" + JSON.stringify(version) + ";",
  "const FILES=" + JSON.stringify(list) + ";",
  "self.addEventListener('install',event=>event.waitUntil((async()=>{const cache=await caches.open(CACHE);for(let i=0;i<FILES.length;i+=16)await cache.addAll(FILES.slice(i,i+16));await self.skipWaiting();})()));",
  "self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const name of await caches.keys())if(name.startsWith('geo-')&&name!==CACHE)await caches.delete(name);await self.clients.claim();for(const client of await self.clients.matchAll())client.postMessage({type:'OFFLINE_READY'});})()));",
  "self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin)return;event.respondWith((async()=>{const cache=await caches.open(CACHE);if(event.request.mode==='navigate')return await cache.match(new URL('./index.html',self.registration.scope).href)||fetch(event.request);return await cache.match(event.request,{ignoreVary:true})||fetch(event.request);})());});",
].join("\n");
await writeFile("dist/sw.js", worker);
console.log(
  "Offline: " + list.length + " recursos locais, versão " + version + ".",
);
