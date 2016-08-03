var gulp = require('gulp');
var typescript = require('gulp-tsc');
var haml = require('gulp-haml');
var watch = require('gulp-watch');
var path = require('path');
var fs = require('fs');
var htmlMin = require('gulp-html-minify');
var cssMin = require('gulp-cssmin');
var rename = require('gulp-rename');
var replace = require('gulp-replace');
var uglify = require('gulp-uglify');


gulp.task('compile_ts', function(){
    gulp.src(['./src/**/*.ts'])
        .pipe(typescript())
        .pipe(gulp.dest('./dist'));
});

gulp.task('build_html', function () {
    gulp.src(['./dist.html'])
        .pipe(htmlMin())
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest('./'));
});

gulp.task('build_css', function () {
    gulp.src('./style.css')
        .pipe(cssMin())
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest('./'));
});


var tscOptions = {
    target: "ES5",
    removeComments: true,
   // noImplicitAny: true,
    declarations: true,
    suppressImplicitAnyIndexErrors: false,
    noEmitOnError: true,
    diagnostics: true
};

gulp.task('build_async_modules', function () {
    tscOptions.out = 'async_modules.js';
    gulp.src([
        './src/module.ts',
        './src/entity.ts',
        './src/async_modules.ts'
    ]).pipe(typescript(tscOptions))
        .pipe(gulp.dest('./clients'));
});

gulp.task('build_http_client', function() {
    tscOptions.out = 'http_client.js';
    gulp.src(['!./src/dev_client.ts', './src/**.ts'])
        .pipe(typescript(tscOptions))
        .pipe(gulp.dest('./clients'));
});

gulp.task('build_dev_client', function() {
    var html = fs.readFileSync('./dist.min.html').toString();
    var css = fs.readFileSync('./style.min.css').toString();
    tscOptions.out = 'dev_client.js';
    gulp.src(['!./src/http_client.ts', './src/**/*.ts'])
        .pipe(typescript(tscOptions))
        .pipe(replace(/REPLACE_WITH_HTML/g, html))
        .pipe(replace(/REPLACE_WITH_CSS/g, css))
        .pipe(gulp.dest('./clients'));
});


gulp.task('production', [
    'build_html',
    'build_css',
    'build_async_modules',
    'build_http_client',
    'build_dev_client'
]);
