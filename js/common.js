  if (navigator.serviceWorker) {
    document.addEventListener('DOMContentLoaded', (event) => {
      navigator.serviceWorker.register('./sw.js', {scope: '/'}).then(function() {
        console.log('Registration worked!')
      }).catch(function(err) {
        console.log('Registration failed!', err);
      });
    });
  }