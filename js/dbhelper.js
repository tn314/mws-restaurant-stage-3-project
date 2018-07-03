/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port
    //return `http://localhost:${port}/data/restaurants.json`;
    return `http://localhost:${port}`;
  }

  static openIdbDatabase() {
    return idb.open('mws-restaurants', 2, function(upgradeDB) {
      //return upgradeDb.createObjectStore('restaurants', {keyPath: 'id'});
      // Note: we don't use 'break' in this switch statement,
      // the fall-through behaviour is what we want.
      switch (upgradeDB.oldVersion) {
        case 0:
          upgradeDB.createObjectStore('restaurants', {keyPath: 'id'});
        case 1:
          upgradeDB.createObjectStore('pending-reviews', { keyPath: 'random_id' });
          upgradeDB.createObjectStore('reviews', {keyPath: 'id'});
      }
    });   
  }

  /** 
   * Fetch all restaurants
   */
  static fetchRestaurants(callback) {
    let dbPromise = DBHelper.openIdbDatabase();

    fetch(`${DBHelper.DATABASE_URL}/restaurants`)
      .then(response => response.json())
      .then(restaurants => {
        dbPromise.then(function(db) {
          if(!db) return;

          var tx = db.transaction('restaurants', 'readwrite');
          var store = tx.objectStore('restaurants');

          restaurants.forEach(function(restaurant) {
            store.put(restaurant);
          });

          return tx.complete;
        });

        callback(null, restaurants);

      }).catch(e => {
        dbPromise.then(function(db) {
          if(!db) return;
          var tx = db.transaction('restaurants', 'readwrite');
          var store = tx.objectStore('restaurants');
          return store.getAll();
        }).then(function(restaurants) {
          console.log('restaurants from idb', restaurants);
          callback(null, restaurants);
        });
      });

  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Fetch reviews for a restaurant
   */
  static fetchReviewsByRestaurantId(restaurant, callback) {

    let dbPromise = DBHelper.openIdbDatabase();

    fetch(`${DBHelper.DATABASE_URL}/reviews?restaurant_id=${restaurant.id}`)
      .then(response => response.json())
      .then(reviews => {
        dbPromise.then(function(db) {
          if(!db) return;

          var tx = db.transaction('reviews', 'readwrite');
          var store = tx.objectStore('reviews');

          reviews.forEach(function(review) {
            store.put(review);
          });

          restaurant.reviews = reviews;

          return tx.complete;
        }).then(function () {
          callback();
        });

      }).catch(e => {
        dbPromise.then(function(db) {
          if(!db) return;
          var tx = db.transaction('reviews', 'readwrite');
          var store = tx.objectStore('reviews');

          return store.getAll();
        }).then(function(reviews) {

          let restaurantReviews = reviews.filter((review) => review.restaurant_id == restaurant.id);
          restaurant.reviews = restaurantReviews;
          
          dbPromise.then(function(db) {
            if(!db) return;
            var tx = db.transaction('pending-reviews', 'readwrite');
            var store = tx.objectStore('pending-reviews');

            return store.getAll();
          }).then(function(pendingReviews) {

            let pendingRestaurantReviews = pendingReviews.filter((review) => {
              return review.restaurantId == restaurant.id;
            });

            restaurant.reviews.push(...pendingRestaurantReviews);

          }).then(function() {
            callback();
          });          
        });
      });
  }

  /**
   * Store a new Review
   */
  static storeReview(newReview, callback) {
    let dbPromise = DBHelper.openIdbDatabase();

    fetch(`${DBHelper.DATABASE_URL}/reviews`, {
      method: 'post',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },        
      body: JSON.stringify({
          "restaurant_id": newReview.restaurantId,
          "name": newReview.name,
          "rating": newReview.rating,
          "comments": newReview.comments
      })
    })  
    .then(response => response.json())
    .then(review => {
      console.log(review);

      dbPromise.then(function(db) {
        if(!db) return;

        var tx = db.transaction('reviews', 'readwrite');
        var store = tx.objectStore('reviews');

        store.put(review);

        if (review.hasOwnProperty('random_id')) {
          DBHelper.deletePendingReviewFromIdb(review);
        }

        tx.complete;

        return review;
      }).then(function (review) {
          callback(review);
      });


    }).catch(() => {
      dbPromise.then(function(db) {
        if(!db) return;

        var tx = db.transaction('pending-reviews', 'readwrite');
        var store = tx.objectStore('pending-reviews');

        newReview.random_id = DBHelper.generateRandomId();

        store.put(newReview);
      
        tx.complete;

        return newReview;

      }).then(function (review) {
        callback(review);
      });


    }); 
   
  }

  /**
   * Delete Pending Review From Idb
   */
  static deletePendingReviewFromIdb(review) {

    let dbPromise = DBHelper.openIdbDatabase();

    dbPromise.then(function(db) {
      if(!db) return;
      var tx = db.transaction('pending-reviews', 'readwrite');
      var store = tx.objectStore('pending-reviews');

      store.delete(review.random_id);
      
      return tx.complete;
    }).then(function() {
      console.log('deleted pending review');
    });

  }


  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    if (! restaurant.photograph) {
      return ('/dist/images/rr-default');
    }

    return (`/dist/images/${restaurant.photograph}`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      icon: {
          anchor: new google.maps.Point(16, 16),
          url: 'data:image/svg+xml;utf-8, \
            <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"> \
              <path fill="red" stroke="white" stroke-width="1.5" d="M3.5 3.5h25v25h-25z" ></path> \
            </svg>'
        },     
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }

  /**
   * Toggle restaurant favorite
   */
  static toggleFavorite(restaurantId, isFavorite) {
    fetch(`${DBHelper.DATABASE_URL}/restaurants/${restaurantId}/?is_favorite=${isFavorite}`, {
      method: 'put',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })  
    .then(response => {
      console.log(response);
    })
    .catch(e => {
      let dbPromise = DBHelper.openIdbDatabase();

        dbPromise.then(function(db) {
          if(!db) return;

          var tx = db.transaction('restaurants', 'readwrite');
          var store = tx.objectStore('restaurants');

          return store.getAll();
        }).then(function (restaurants) {
          let restaurant = restaurants.filter(restaurant => restaurant.id == restaurantId)[0];

          restaurant.is_favorite = isFavorite;
          restaurant.is_favorite_pending = true;

          dbPromise.then(function(db) {
            if(!db) return;

            var tx = db.transaction('restaurants', 'readwrite');
            var store = tx.objectStore('restaurants');

            store.put(restaurant);

            return tx.complete;
          }).then(function() {
             console.log('updated restaurant in db');
          });

        });      
    });
  }

  /**
   * Submit pending favorites
   */
  static submitRestaurantPendingFavorites(restaurant) {
    fetch(`${DBHelper.DATABASE_URL}/restaurants/${restaurant.id}/?is_favorite=${restaurant.is_favorite}`, {
      method: 'put',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })  
    .then(response => {
        let dbPromise = DBHelper.openIdbDatabase();

        dbPromise.then(function(db) {
        if(!db) return;
        var tx = db.transaction('restaurants', 'readwrite');
        var store = tx.objectStore('restaurants');

        restaurant.is_favorite_pending = false;
        store.put(restaurant);

        return tx.complete;
    })
    }).catch(e => {

    });
  }

  static generateRandomId() {
    return '_' + Math.random().toString(36).substr(2, 9);
  }

}
