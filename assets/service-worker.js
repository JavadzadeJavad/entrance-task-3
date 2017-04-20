'use strict';

/**
 * @file
 * Сервис-воркер, обеспечивающий оффлайновую работу избранного
 */

var CACHE_VERSION = '1.0.0-broken';

var urlsToCache = [
    '/',
    'style.css',
    'templates.js',
    'blocks.js'
];

importScripts('vendor/kv-keeper.js-1.0.4/kv-keeper.js');

self.addEventListener('install', function (event) {
    var promise = getAllFavorites();

    event.waitUntil(promise);

});

self.addEventListener('activate', function (event) {
    var promise = deleteObsoleteCaches().then(function () {
        // Вопрос №2: зачем нужен этот вызов?
        self.clients.claim();

        console.log('[ServiceWorker] Activated!');
    });
    event.waitUntil(promise);
});

self.addEventListener('fetch', function (event) {
    var url = new URL(event.request.url);

    // Вопрос №3: для всех ли случаев подойдёт такое построение ключа?
    var cacheKey = url.origin + url.pathname;

    var response = void 0;
    if (needStoreForOffline(cacheKey)) {
        response = caches.match(cacheKey).then(function (cacheResponse) {
            return cacheResponse || fetchAndPutToCache(cacheKey, event.request);
        });
    } else {
        response = fetchWithFallbackToCache(event.request);
    }
    event.respondWith(response);
});


self.addEventListener('message', function (event) {
    var promise = handleMessage(event.data);

});

// Извлечь из БД добавленные в избранное картинки
function getAllFavorites() {
    return new Promise(function (resolve, reject) {
        KvKeeper.getKeys(function (err, keys) {
            if (err) {
                return reject(err);
            }

            var ids = keys.filter(function (key) {
                return key.startsWith('favorites:');
            })
            // 'favorites:'.length == 10
                .map(function (key) {
                    return key.slice(10);
                });

            Promise.all(ids.map(getFavoriteById)).then(function (urlGroups) {
                return urlGroups.reduce(function (res, urls) {
                   return res.concat(urls);
                }, []);

            })
        });
    });
}

// Извлечь из БД запись о картинке
function getFavoriteById(id) {
    return new Promise(function (resolve, reject) {
        KvKeeper.getItem('favorites:' + id, function (err, val) {
            if (err) {
                return reject(err);
            }

            var data = JSON.parse(val);
            var images = [data.fallback].concat(data.sources.map(function (item) {
                return item.url;
            }));
            caches.open(CACHE_VERSION)
                .then(function(cache) {
                    return cache.addAll(images);
                });
            resolve(images);

        })

    });
}

// Удалить неактуальный кеш
function deleteObsoleteCaches() {
    return caches.keys().then(function (names) {
        // Вопрос №4: зачем нужна эта цепочка вызовов?
        return Promise.all(names.filter(function (name) {
            return name !== CACHE_VERSION;
        }).map(function (name) {
            console.log('[ServiceWorker] Deleting obsolete cache:', name);
            return caches.delete(name);
        }));
    });
}

// Нужно ли при скачивании сохранять ресурс для оффлайна?
function needStoreForOffline(cacheKey) {
    return cacheKey.includes('vendor/') || cacheKey.includes('assets/') || cacheKey.endsWith('jquery.min.js');
}

// Скачать и добавить в кеш
function fetchAndPutToCache(cacheKey, request) {

    return fetch(request).then(function (response) {
        return caches.open(CACHE_VERSION).then(function (cache) {
            // Вопрос №5: для чего нужно клонирование?
            cache.put(cacheKey, response.clone());
        }).then(function () {
            return response;
        });
    }).catch(function (err) {
        console.error('[ServiceWorker] Fetch error:', err);
        return caches.match(cacheKey);
    });
}

// Попытаться скачать, при неудаче обратиться в кеш
function fetchWithFallbackToCache(request) {
    return fetch(request).catch(function () {
        console.log('[ServiceWorker] Fallback to offline cache:', request.url);
        return caches.match(request.url);
    });
}

// Обработать сообщение от клиента
var messageHandlers = {
    'favorite:add': handleFavoriteAdd
};

function handleMessage(eventData) {
    var message = eventData.message;
    var id = eventData.id;
    var data = eventData.data;

    console.log('[ServiceWorker] Got message:', message, 'for id:', id);

    var handler = messageHandlers[message];
    return Promise.resolve(handler && handler(id, data));
}

// Обработать сообщение о добавлении новой картинки в избранное
function handleFavoriteAdd(id, data) {
    return caches.open(CACHE_VERSION).then(function (cache) {
        var urls = [].concat(data.fallback, (data.sources || []).map(function (item) {
            return item.url;
        }));

        return Promise.all(urls.map(function (url) {
            return fetch(url);
        })).then(function (responses) {
            return Promise.all(responses.map(function (response) {
                return cache.put(response.url, response);
            }));
        });
    });
}
