"use strict";
var gulp = require('gulp'),
    useref = require('gulp-useref'),
    gulpif = require('gulp-if'),
    ngAnnotate = require('gulp-ng-annotate'),
    uglify = require('gulp-uglify'),
    minifyCss = require('gulp-minify-css'),
    uncss = require('gulp-uncss'),
    shell = require('gulp-shell');

gulp.task('minify', function () {
    var assets = useref.assets();
    return gulp.src('src/newtab.html')
        .pipe(assets)
        .pipe(gulpif('*.js', ngAnnotate()))
        .pipe(gulpif('*.js', uglify()))
        .pipe(gulpif('*.css', uncss({
            html: ['src/*.html']
        })))
        .pipe(gulpif('*.css', minifyCss()))
        .pipe(assets.restore())
        .pipe(useref())
        .pipe(gulp.dest('endo'));
});

gulp.task('pack', shell.task([
    '\/Applications\/Google\\ Chrome.app\/Contents\/MacOS\/Google\\ Chrome --pack-extension=\/Users\/Enzo\/Dev\/Web\/endo\/endo\/ --pack-extension-key=\/Users\/Enzo\/Dev\/Web\/endo\/endo.pem'
]));

gulp.task('default', ['minify','pack']);

///Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --pack-extension=/Users/Enzo/Dev/Web/endo/endo/
