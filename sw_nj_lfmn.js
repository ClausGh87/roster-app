const CACHE='nj-lfmn-v1';
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(['./nj_lfmn_roster.html','./manifest_nj_lfmn.json']).catch(()=>{})));
  self.skipWaiting();
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(n=>n!==CACHE).map(n=>caches.delete(n)))));
  self.clients.claim();
});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET'||e.request.url.includes('simbrief.com'))return;
  e.respondWith(caches.match(e.request).then(cached=>{
    if(cached)return cached;
    return fetch(e.request).then(r=>{
      if(r&&r.status===200)caches.open(CACHE).then(c=>c.put(e.request,r.clone()));
      return r;
    }).catch(()=>e.request.destination==='document'?caches.match('./nj_lfmn_roster.html'):undefined);
  }));
});
