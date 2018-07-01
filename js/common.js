  if (navigator.serviceWorker) {
    document.addEventListener('DOMContentLoaded', (event) => {
      navigator.serviceWorker.register('./sw.js', {scope: '/'}).then(function() {
        console.log('Registration worked!');        
      }).catch(function(err) {
        console.log('Registration failed!', err);
      });

      navigator.serviceWorker.ready.then(function(swRegistration) {
        console.log('sw registration sync ready');
        swRegistration.sync.register('submitPendingFavorites');
        swRegistration.sync.register('submitPendingReviews');
      });
           
    });
  }

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