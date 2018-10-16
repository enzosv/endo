'use strict'

const packageName = 'endo'

const gulp = require('gulp')
const useref = require('gulp-useref')
const gulpif = require('gulp-if')
const ngAnnotate = require('gulp-ng-annotate')
const uglify = require('gulp-uglify')
const cssnano = require('gulp-cssnano')
const del = require('del')
const htmlmin = require('gulp-htmlmin')
const zip = require('gulp-vinyl-zip')
const purify = require('gulp-purifycss')

function minifyAssets (cb) {
  gulp.src('src/*.html')
    .pipe(useref())
    .pipe(gulpif('*.js', ngAnnotate()))
    .pipe(gulpif('*.js', uglify()))
    .pipe(gulpif('*.css', purify(['./src/html/*.html', './src/*.html'])))
    .pipe(gulpif('*.css', cssnano()))
    .pipe(gulp.dest(packageName))
  cb()
}

function minifyHTML (cb) {
  gulp.src('src/html/*.html')
    .pipe(htmlmin({
      collapseWhitespace: false
    }))
    .pipe(gulp.dest(packageName + '/html'))
  cb()
}

function cleanFolder () {
  return del([
    packageName
  ])
}

function cleanZip () {
  return del([
    packageName + '.zip'
  ])
}

function copyManifest (cb) {
  gulp.src('src/manifest.json')
    .pipe(gulp.dest(packageName))
  cb()
}

function copyFont (cb) {
  gulp.src('src/css/fonts/*')
    .pipe(gulp.dest(packageName + '/fonts'))
  cb()
}

function pack (cb) {
  gulp.src(packageName + '/**/*')
    .pipe(zip.dest(packageName + '.zip'))
  cb()
}

const build = gulp.series(
  cleanFolder,
  gulp.parallel(minifyAssets, minifyHTML, copyManifest, copyFont)
)

exports.default = build

exports.clean = gulp.parallel(cleanFolder, cleanZip)
exports.pack = gulp.series(pack)
