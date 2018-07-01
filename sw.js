self.importScripts('/node_modules/idb/lib/idb.js', '/js/dbhelper.js');

var staticCacheName = 'restaurant-reviews-static-v1';
var contentImgsCache = 'restaurant-reviews-content-imgs';
var allCaches = [
  staticCacheName,
  contentImgsCache
];

self.addEventListener('install', function(event) {
  
  const urlsToCache = [
    '/',
    'restaurant.html',
    'dist/css/style.min.css',
    'dist/js/main.min.js',
    'dist/js/restaurant_info.min.js',              
  ];


  event.waitUntil(
    caches.open(staticCacheName).then(function(cache) {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(cacheName) {
          return cacheName.startsWith('restaurant-reviews-') &&
                 !allCaches.includes(cacheName);
        }).map(function(cacheName) {
          return caches.delete(cacheName);
        })
      );
    })
  );
});

self.addEventListener('fetch', function(event) {
  var requestUrl = new URL(event.request.url);

  if (requestUrl.origin === location.origin) {
    if (requestUrl.pathname.startsWith('/dist/images/')) {
      event.respondWith(servePhoto(event.request));
      return;
    }
  }

  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );  
});

function servePhoto(request) {
  // Photo urls look like:
  // /photos/9-8028-7527734776-e1d2bda28e-800px.jpg
  // But storageUrl has the -800px.jpg bit missing.
  // Use this url to store & match the image in the cache.
  // This means you only store one copy of each photo.
  var storageUrl = request.url.replace(/-\d+px\.jpg$/, '');

  // HINT: cache.put supports a plain url as the first parameter
  return caches.open(contentImgsCache).then(function(cache) {
    return cache.match(storageUrl).then(function(response) {
      if (response) return response;

      return fetch(request).then(function(networkResponse) {
        cache.put(storageUrl, networkResponse.clone());
        return networkResponse;
      });
    });
  });
}

self.addEventListener('sync', function(event) {

  if (event.tag == 'submitPendingReviews') {
    event.waitUntil(checkPendingReviews());
  }

  if (event.tag == 'submitPendingFavorites') {
    event.waitUntil(checkPendingFavorites());
  }  

});

function checkPendingReviews() {
  let dbPromise = DBHelper.openIdbDatabase();

  dbPromise.then(function(db) {
    if(!db) return;
    var tx = db.transaction('pending-reviews', 'readwrite');
    var store = tx.objectStore('pending-reviews');

    return store.getAll();
  }).then(function(pendingReviews) {
    pendingReviews.forEach(function(review) {
      DBHelper.deletePendingReviewFromIdb(review);

      DBHelper.storeReview(review, function (review) {
        console.log('submiting pending reviews');
      });   
    });
  });
}


function checkPendingFavorites() {
  let dbPromise = DBHelper.openIdbDatabase();

  dbPromise.then(function(db) {
    if(!db) return;
    var tx = db.transaction('restaurants', 'readwrite');
    var store = tx.objectStore('restaurants');

    return store.getAll();
  }).then(function(restaurants) {
    restaurants.forEach(function(restaurant) {

      if (restaurant.is_favorite_pending == "true" || restaurant.is_favorite_pending == true) {
        DBHelper.submitRestaurantPendingFavorites(restaurant);
      }
    });
  });
}
