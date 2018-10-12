"use strict";
var gulp = require('gulp'),
    useref = require('gulp-useref'),
    gulpif = require('gulp-if'),
    ngAnnotate = require('gulp-ng-annotate'),
    uglify = require('gulp-uglify'),
    csso = require('gulp-csso'),
    uncss = require('gulp-postcss'),
    shell = require('gulp-shell'),
    runSequence = require('run-sequence'),
    del = require('del'),
    htmlmin = require('gulp-htmlmin'),
    // purify = require('gulp-purifycss'),
    zip = require('gulp-vinyl-zip'),
    replace = require('gulp-replace'),
    rename = require("gulp-rename"),
    changed = require('gulp-changed');

var packageName = 'endo';

gulp.task('minify-assets', function () {
    return gulp.src('src/*.html')
        .pipe(gulpif('*.js', ngAnnotate()))
        .pipe(gulpif('*.js', uglify()))
        .pipe(gulpif('*.css', uncss({
            ignore: [
                /\.table/
            ],
            html: ["src/*.html", "src/html/*.html"]
        })))
        // .pipe(gulpif('*.css', purify(['src/*.html'])))
        .pipe(gulpif('*.css', csso()))
        .pipe(useref())
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
        // .pipe(uglify())
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
