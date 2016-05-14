/*
 
 Quick-start
 
 1. Install gulp, gulp-shell and gulp-changed via npm
 2. Save this file to your project dir and rename it to 'gulpfile.js'
 3. Run gulp to upload only changed files to your nodemcu
 
 Notes
 This script assumes that your *.lua files reside in a subdirectoty called 'src'. Change accordingly.
 Also each *.lua file is copied to a 'dist' directory. This is to keep track of the last time the file was uploaded.

*/

var gulp  = require('gulp');
var shell = require('gulp-shell');
var changed = require('gulp-changed');

var SRC = 'src/**/*.lua';
var DEST = 'dist';

gulp.task('default', function() {

  var result = gulp.src(SRC, { base: 'src' })
    .pipe(changed(DEST))
    .pipe(shell("echo changed: <%= file.relative %>"))
    .pipe(shell("nodemcu-tool --silent upload --remotename <%= file.relative %> src/<%= file.relative %>"))
    .pipe(gulp.dest(DEST));

  return result;
});
