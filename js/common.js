  if (navigator.serviceWorker) {
    document.addEventListener('DOMContentLoaded', (event) => {
      navigator.serviceWorker.register('./sw.js', {scope: '/'}).then(function() {
        console.log('Registration worked!');        
      }).catch(function(err) {
        console.log('Registration failed!', err);
      });

        navigator.serviceWorker.ready.then(function(swRegistration) {
          console.log('sw registration sync ready');
          return swRegistration.sync.register('submitPendingReviews');
        });      
    });
  }
