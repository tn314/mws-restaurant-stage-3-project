  if (navigator.serviceWorker) {
    document.addEventListener('DOMContentLoaded', (event) => {
      navigator.serviceWorker.register('./sw.js', {scope: '/'}).then(function() {
        console.log('Registration worked!');        
      }).catch(function(err) {
        console.log('Registration failed!', err);
      });     
    });
  }


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