var gulp = require('gulp'),
    uglify = require('gulp-uglify'),
    concat = require('gulp-concat'),
    sourcemaps = require('gulp-sourcemaps'),
    del = require('del');

gulp.task('clean', function(cb) {
    del(['build/dist/**/*'], cb);
});

gulp.task('scripts', ['scripts-cat', 'scripts-min']);

gulp.task('scripts-cat', function() {
   return gulp
            .src('js/**/*.js')
            .pipe(sourcemaps.init())
            .pipe(concat('cotm-demo.js'))
            .pipe(sourcemaps.write('/'))
            .pipe(gulp.dest('build/dist'))
});

gulp.task('scripts-min', function() {
    return gulp
        .src('js/**/*.js')
        .pipe(sourcemaps.init())
        .pipe(uglify())
        .pipe(concat('cotm-demo.min.js'))
        .pipe(sourcemaps.write('/'))
        .pipe(gulp.dest('build/dist'))
});


gulp.task('default', ['clean'], function() {
   gulp.start('scripts', 'watch');
});

gulp.task('watch', function() {
   gulp.watch('js/**/*.js', ['scripts']);
});