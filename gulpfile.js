var gulp = require('gulp');
var autoprefixer = require('gulp-autoprefixer');
var concat = require('gulp-concat');
var cssnano = require('gulp-cssnano');
var uglify = require('gulp-uglify');
var babel = require('gulp-babel');
var sourcemaps = require('gulp-sourcemaps');
var imageresize = require('gulp-image-resize');
var imagemin = require('gulp-imagemin');
var pngquant = require('imagemin-pngquant');
var rename = require('gulp-rename');
var del = require('del');
 
gulp.task('default', ['styles', 'scripts', 'images']);


/* STYLES */
gulp.task('styles', function() {
    return gulp.src(['./css/normalize.css', './css/styles.css'])
        .pipe(autoprefixer('last 2 version'))
        .pipe(cssnano())
        .pipe(concat('style.min.css'))
        .pipe(gulp.dest('./dist/css/'));
});

/* SCRIPTS */
gulp.task('scripts', function() {
  gulp.src(['node_modules/idb/lib/idb.js', 'js/dbhelper.js', 'js/common.js', 'js/main.js'])
    .pipe(babel())
    .pipe(concat('main.min.js'))
    .pipe(uglify().on('error', function(e){
      console.log(e);
    }))
    .pipe(gulp.dest('dist/js'));


  gulp.src(['node_modules/idb/lib/idb.js', 'js/dbhelper.js', 'js/common.js', 'js/restaurant_info.js'])
    .pipe(babel())
    .pipe(concat('restaurant_info.min.js'))
    .pipe(uglify().on('error', function(e){
      console.log(e);
    }))
    .pipe(gulp.dest('dist/js'));    
});

/* IMAGES */
var imageSizes = [
    { width: 800 },
    { width: 600 },
    { width: 400 }
];

gulp.task('images', function () {
  del(['dist/images/*'])
      
  imageSizes.forEach(function(size){
        
  var resize_settings = {
    width: size.width,
    crop: false,
    upscale : false
  }

  gulp.src('img/*')
    .pipe(imageresize(resize_settings))
    .pipe(imagemin({
      progressive: true,
      svgoPlugins: [{removeViewBox: false}],
      use: [pngquant()]
    }))
    .pipe(rename(function (path) {
      path.basename += `-${resize_settings.width}px`;
    }))            
    .pipe(gulp.dest('dist/images/'));
  });
});