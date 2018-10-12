"use strict";
var gulp = require('gulp'),
    useref = require('gulp-useref'),
    gulpif = require('gulp-if'),
    ngAnnotate = require('gulp-ng-annotate'),
    uglify = require('gulp-uglify'),
    cssnano = require('gulp-cssnano'),
    runSequence = require('run-sequence'),
    del = require('del'),
    htmlmin = require('gulp-htmlmin'),
    zip = require('gulp-vinyl-zip'),
    purify = require('gulp-purifycss');

var packageName = 'endo';

gulp.task('minify-assets', function () {
    return gulp.src('src/*.html')
        .pipe(useref())
        .pipe(gulpif('*.js', ngAnnotate()))
        .pipe(gulpif('*.js', uglify()))
        .pipe(gulpif('*.css', purify(['./src/html/*.html', './src/*.html'])))
        .pipe(gulpif('*.css', cssnano()))
        .pipe(gulp.dest(packageName));
});

gulp.task('minify-html', function () {
    return gulp.src('src/html/*.html')
        .pipe(htmlmin({
            collapseWhitespace: false
        }))
        .pipe(gulp.dest(packageName + '/html'));
});

gulp.task('clean-folder', function () {
    return del([
        packageName
    ]);
});

gulp.task('copy-manifest', function () {
    return gulp.src('src/manifest.json')
        .pipe(gulp.dest(packageName));
});

gulp.task('copy-font', function () {
    return gulp.src('src/css/fonts/*')
        .pipe(gulp.dest(packageName + '/fonts'));
});

gulp.task('clean-zip', function () {
    return del([
        packageName + '.zip'
    ]);
});

gulp.task('zip', function () {
    return gulp.src(packageName + "/**/*")
        .pipe(zip.dest(packageName + '.zip'));
});

gulp.task('default', function (callback) {
    runSequence(['minify-assets', 'minify-html'],
        callback);
});

gulp.task('recreate', function (callback) {
    runSequence(['clean-folder', 'clean-zip'], ['minify-assets', 'minify-html', 'copy-manifest', 'copy-font'], 'zip',
        callback);
});
