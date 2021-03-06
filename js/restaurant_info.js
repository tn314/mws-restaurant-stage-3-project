let restaurant;
var map;

document.addEventListener('DOMContentLoaded', function () {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      fillBreadcrumb();     
    }
  });
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
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();

      if (document.getElementById('map-trigger').getAttribute('data-map-loaded')) {
        DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
        document.getElementById('map-trigger').style.display = 'none';      
      }      
    }
  });
}

/**
 * Get current restaurant from page URL.
 */
window.fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
window.fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img';
  image.alt = restaurant.name + ' restaurant';

  const imageName = DBHelper.imageUrlForRestaurant(restaurant);

  const smallImage = `${imageName}-400px.jpg`;
  const mediumImage = `${imageName}-600px.jpg`;
  const largeImage = `${imageName}-800px.jpg`;

  const star = document.getElementById('favorite-star-svg');
  const favoriteStar = document.getElementById('favorite-star');

  if (restaurant.is_favorite == "true" || restaurant.is_favorite === true) {
    star.classList.add("is-favorite");
  }

  image.src = smallImage;
  image.setAttribute('srcset', `${smallImage} 400w, ${mediumImage} 600w, ${largeImage} 800w, ${largeImage} 2x`); 
  //image.src = '/dist/images/rr-default-400px.jpg';
  //image.setAttribute('data-src', smallImage);
  //image.setAttribute('data-srcset', `${smallImage} 400w, ${mediumImage} 600w, ${largeImage} 800w, ${largeImage} 2x`); 

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }

  if (restaurant) {
    DBHelper.fetchReviewsByRestaurantId(restaurant, fillReviewsHTML);
  }
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
window.fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
window.fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h2');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
window.createReviewHTML = (review) => {
  const li = document.createElement('li');
  const header = document.createElement('header');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  header.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = review.updatedAt;
  header.appendChild(date);

  li.appendChild(header);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating} <span aria-hidden="true">${'&#9733;'.repeat(review.rating)}</span>`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
window.fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  li.setAttribute('aria-current', 'page');
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
window.getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}



const reviewsForm = document.getElementById('reviews-form');
const ul = document.getElementById('reviews-list');

reviewsForm.addEventListener('submit', function (e) {
  e.preventDefault();

  let restaurantId = getParameterByName('id', window.location);
  let name = reviewsForm.elements["name"].value;
  let rating = reviewsForm.elements["rating"].value;
  let comments = reviewsForm.elements["comments"].value;
  let newReview = {
      restaurantId,
      name,
      rating,
      comments
  }

  DBHelper.storeReview(newReview, function (review) {
    ul.appendChild(createReviewHTML(review));
    reviewsForm.reset();
  });
});



document.getElementById('favorite-star').addEventListener('click', function (e) {

  const star = document.getElementById('favorite-star-svg');
  star.classList.toggle('is-favorite');

  let restaurantId = getParameterByName('id', window.location);

  if (star.classList.contains('is-favorite')) {
    console.log('is-starred');
    DBHelper.toggleFavorite(restaurantId, true);
  } else {
    console.log('not starred');
    DBHelper.toggleFavorite(restaurantId, false);
  }
});

