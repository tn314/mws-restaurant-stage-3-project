  if (navigator.serviceWorker) {
    document.addEventListener('DOMContentLoaded', (event) => {
      navigator.serviceWorker.register('./sw.js', {scope: '/'}).then(function() {
        console.log('Registration worked!');        
      }).catch(function(err) {
        console.log('Registration failed!', err);
      });     
    });
  }

/*
window.setTimeout(function() {
  let images = document.querySelectorAll('source, img');

  if ('IntersectionObserver' in window) {
    // IntersectionObserver Supported
    let config = {
          root: null,
          rootMargin: '0px',
          threshold: 0.5
        };

    let observer = new IntersectionObserver(onChange, config);
    images.forEach(img => observer.observe(img));

    function onChange(changes, observer) {
      changes.forEach(change => {
        if (change.intersectionRatio > 0) {
          // Stop watching and load the image
          loadImage(change.target);
          observer.unobserve(change.target);
        }
      });
    }

  } else {
    // IntersectionObserver NOT Supported
    images.forEach(image => loadImage(image));
  }

  function loadImage(image) {
    //console.log(image.classList.contains('restaurant-img'));
    if(image.dataset && image.dataset.src) {
      image.src = image.dataset.src;
    }

    if(image.dataset && image.dataset.srcset) {
      image.srcset = image.dataset.srcset;
    }
  }

  document.getElementById('map').style.display = 'block';
  
}, 2000);
*/

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
  
window.addEventListener('offline', function(e) { 
  console.log('offline'); 
  document.getElementById('offline-alert').style.display = 'block';
});

window.addEventListener('online', function(e) { 
  console.log('online');
  document.getElementById('offline-alert').style.display = 'none';
  checkPendingReviews();
  checkPendingFavorites();
});