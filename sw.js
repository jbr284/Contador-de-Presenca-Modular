const CACHE_NAME = 'app-faltas-v1';

// Arquivos estruturais do sistema (Interface e Lógica)
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.3.0/exceljs.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js'
];

// INSTALAÇÃO: Guarda os arquivos no cache do celular
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// ATIVAÇÃO: Limpa caches antigos se você atualizar a versão (v2, v3...)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// INTERCEPTAÇÃO (Estratégia: Network First, caindo para Cache)
self.addEventListener('fetch', (event) => {
  // Ignora requisições do Firebase/Firestore (Deixa passar direto pra internet)
  if (event.request.url.includes('firestore.googleapis.com') || event.request.url.includes('firebase')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Se pegou da internet com sucesso, atualiza o cache invisivelmente
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      })
      .catch(() => {
        // Se a internet falhar (offline), busca no cache do celular
        return caches.match(event.request);
      })
  );
});