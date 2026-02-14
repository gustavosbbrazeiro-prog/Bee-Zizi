
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open('bz-v1');
    await cache.addAll([
      './', './index.html', './style.css', './app.js', './manifest.webmanifest',
      './icons/icon-192.png','./icons/icon-512.png','./icons/maskable-512.png'
    ]);
  })());
});
self.addEventListener('activate', (event)=>{
  event.waitUntil((async()=>{
    const keys = await caches.keys();
    await Promise.all(keys.filter(k=>k!=='bz-v1').map(k=>caches.delete(k)));
  })());
});
self.addEventListener('fetch', (event)=>{
  event.respondWith((async()=>{
    const cached = await caches.match(event.request);
    if(cached) return cached;
    try{ return await fetch(event.request); }catch(e){ return cached || Response.error(); }
  })());
});
