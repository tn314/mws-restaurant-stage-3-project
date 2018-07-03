
let restaurants,
  neighborhoods,
  cuisines;
var map;
var markers = [];

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  fetchNeighborhoods();
  fetchCuisines();
  updateRestaurants();
});


document.getElementById('map-trigger').addEventListener('click', function () {
  var scriptElement=document.createElement('script');
  scriptElement.type = 'text/javascript';
  document.getElementById('map').style.display = 'block';
  scriptElement.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyDunksyNNWtdeDofpYNRksd6-1Bifl3MeQ&libraries=places&callback=initMap';
  document.body.appendChild(scriptElement);
  document.getElementById('map-trigger').setAttribute('data-map-loaded', true);
});


/**
 * Fetch all neighborhoods and set their HTML.
 */
window.fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
window.fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  select.setAttribute('aria-label', 'Select Neighborhood');

  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
window.fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
window.fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');
  select.setAttribute('aria-label', 'Select Cuisine');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  updateRestaurants();
}

/**
 * Update page and map for current restaurants.
 */
window.updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
window.resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const article = document.getElementById('restaurants-list');
  article.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
window.fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const section = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    section.append(createRestaurantHTML(restaurant));
  });

  if (document.getElementById('map-trigger').getAttribute('data-map-loaded')) {
    addMarkersToMap();
    document.getElementById('map-trigger').style.display = 'none';
  }
}

/**
 * Create restaurant HTML.
 */
window.createRestaurantHTML = (restaurant) => {
  const article = document.createElement('article');

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.alt = restaurant.name + ' restaurant';

  const imageName = DBHelper.imageUrlForRestaurant(restaurant);

  const smallImage = `${imageName}-400px.jpg`;
  const mediumImage = `${imageName}-600px.jpg`;
  const largeImage = `${imageName}-800px.jpg`;

  image.src = smallImage;
  image.setAttribute('srcset', `${largeImage} 2x`);
  //image.src = '/dist/images/rr-default-400px.jpg';
  //image.setAttribute('data-src', smallImage);
  //image.setAttribute('data-srcset', `${largeImage} 2x`);   

  article.append(image);

  const name = document.createElement('h3');
  name.innerHTML = restaurant.name;
  article.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  article.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  article.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.setAttribute('aria-label', 'View details about ' + restaurant.name + ' restaurant');
  more.setAttribute('role', 'button');
  more.href = DBHelper.urlForRestaurant(restaurant);
  article.append(more)

  return article
}

/**
 * Add markers for current restaurants to the map.
 */
window.addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
}

