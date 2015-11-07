"use strict";
var gulp = require('gulp'),
    useref = require('gulp-useref'),
    gulpif = require('gulp-if'),
    ngAnnotate = require('gulp-ng-annotate'),
    uglify = require('gulp-uglify'),
    csso = require('gulp-csso'),
    uncss = require('gulp-uncss'),
    shell = require('gulp-shell'),
    runSequence = require('run-sequence'),
    del = require('del'),
    htmlmin = require('gulp-htmlmin'),
    // purify = require('gulp-purifycss'),
    zip = require('gulp-zip');

var packageName = 'endo';

gulp.task('minify-assets', function () {
    var assets = useref.assets();
    return gulp.src('src/*.html')
        .pipe(assets)
        .pipe(gulpif('*.js', ngAnnotate()))
        .pipe(gulpif('*.js', uglify()))
        .pipe(gulpif('*.css', uncss({
            ignore: [
                /\.table/
            ],
            html: ["src/*.html"]
        })))
        // .pipe(gulpif('*.css', purify(['src/*.html'])))
        .pipe(gulpif('*.css', csso()))
        .pipe(assets.restore())
        .pipe(useref())
        .pipe(gulp.dest(packageName));
});

gulp.task('minify-html', function () {
    return gulp.src(packageName + '/*.html')
        .pipe(htmlmin({
            collapseWhitespace: true
        }))
        .pipe(gulp.dest(packageName));
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

gulp.task('clean-crx', function () {
    return del([
        packageName + '.crx'
    ]);
});

gulp.task('clean-zip', function () {
    return del([
        packageName + '.zip'
    ]);
});


gulp.task('zip', function () {
    return gulp.src(packageName+'/*')
        .pipe(zip(packageName + '.zip'))
        .pipe(gulp.dest(''));
});

gulp.task('pack', shell.task([
    '\/Applications\/Google\\ Chrome.app\/Contents\/MacOS\/Google\\ Chrome --pack-extension=\/Users\/Enzo\/Dev\/Web\/endo\/endo\/ --pack-extension-key=\/Users\/Enzo\/Dev\/Web\/endo\/endo.pem'
]));

gulp.task('default', function (callback) {
    runSequence('minify-assets', ['pack', 'zip'],
        callback);
});

gulp.task('recreate', function (callback) {
    runSequence(['clean-folder', 'clean-crx', 'clean-zip'], ['minify-assets', 'copy-manifest', 'copy-font'], ['pack', 'zip'],
        callback);
});
