"use strict";
var gulp = require('gulp'),
    useref = require('gulp-useref'),
    gulpif = require('gulp-if'),
    ngAnnotate = require('gulp-ng-annotate'),
    uglify = require('gulp-uglify'),
    minifyCss = require('gulp-minify-css'),
    uncss = require('gulp-uncss'),
    shell = require('gulp-shell'),
    runSequence = require('run-sequence'),
    clean = require('gulp-clean');

var packageName = 'endo';

gulp.task('minify', function () {
    var assets = useref.assets();
    return gulp.src('src/*.html')
        .pipe(assets)
        .pipe(gulpif('*.js', ngAnnotate()))
        .pipe(gulpif('*.js', uglify()))
        .pipe(gulpif('*.css', uncss({
            html: ['src/*.html']
        })))
        .pipe(gulpif('*.css', minifyCss()))
        .pipe(assets.restore())
        .pipe(useref())
        .pipe(gulp.dest(packageName));
});

gulp.task('clean', function () {
    return gulp.src(packageName, {
            read: false
        })
        .pipe(clean());
});

gulp.task('copy-manifest', function () {
    return gulp.src('src/manifest.json')
        .pipe(gulp.dest(packageName));
});

gulp.task('copy-font', function () {
    return gulp.src('src/bower_components/font-awesome/fonts/fontawesome-webfont.woff2')
        .pipe(gulp.dest(packageName+'/fonts'));
});

gulp.task('clean-crx', function () {
    return gulp.src(packageName+'.crx', {
            read: false
        })
        .pipe(clean());
});

gulp.task('pack', shell.task([
    '\/Applications\/Google\\ Chrome.app\/Contents\/MacOS\/Google\\ Chrome --pack-extension=\/Users\/Enzo\/Dev\/Web\/endo\/endo\/ --pack-extension-key=\/Users\/Enzo\/Dev\/Web\/endo\/endo.pem'
]));

gulp.task('default', function (callback) {
    runSequence(['clean', 'clean-crx'], ['copy-manifest', 'copy-font'], 'minify', 'pack',
        callback);
});
