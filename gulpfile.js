"use strict";

var lr = require('tiny-lr'), // Минивебсервер для livereload
    gulp = require('gulp'),
    livereload = require('gulp-livereload'), // Livereload для Gulp
    csso = require('gulp-csso'), // Минификация CSS
    imagemin = require('gulp-imagemin'), // Минификация изображений
    uglify = require('gulp-uglify'), // Минификация JS
    concat = require('gulp-concat'), // Склейка файлов
    rigger = require('gulp-rigger'),
    fileinclude  =  require('gulp-file-include'),
    connect = require('connect'),
    connect_static = require('serve-static'),
    connect_lv = require('connect-livereload'),
    server = lr();

gulp.task('default', function () {
    // place code for your default task 
    console.log("Hello World!");
});




// Собираем Stylus
gulp.task('style', function () {
    gulp.src('./assets/css/**/*.css')
        .pipe(concat('style.css')) // собираем stylus
        .pipe(gulp.dest('./public/css/')) // записываем css
        .pipe(livereload(server)); // даем команду на перезагрузку css
});

// Собираем html
gulp.task('html', function () {
    gulp.src(['./assets/template/**/*.html', '!./assets/template/**/_*.html'])
        .pipe(fileinclude({     
            prefix: '@@',
            basepath: '@file'
        })) // Собираем HTML только в папке ./assets/template/ исключая файлы с _*
        .pipe(gulp.dest('./public/')) // Записываем собранные файлы
        .pipe(livereload(server)); // даем команду на перезагрузку страницы
});

// Собираем JS
gulp.task('js', function () {
    gulp.src([
            './node_modules/angular/angular.js',
            './node_modules/angular-ui-router/release/angular-ui-router.js',
            './node_modules/satellizer/dist/satellizer.js',
            './node_modules/restangular/dist/restangular.js',
            './node_modules/ngstorage/ngStorage.js',
            './assets/js/**/*.js',
            '!./assets/js/vendor/**/*.js'
        ])
        .pipe(concat('index.js')) // Собираем все JS, кроме тех которые находятся в ./assets/js/vendor/**
        .pipe(uglify({mangle: false}))
        .pipe(gulp.dest('./public/js'))
        .pipe(livereload(server)); // даем команду на перезагрузку страницы
});

// Копируем и минимизируем изображения
gulp.task('images', function () {
    gulp.src('./assets/img/**/*')
        .pipe(imagemin())
        .pipe(gulp.dest('./public/img'))
});

// Локальный сервер для разработки
gulp.task('http-server', function () {
    connect()
        .use(connect_lv())
        .use(connect_static('./public'))
        .listen('9000');

    console.log('Server listening on http://localhost:9000');
});

// Запуск сервера разработки gulp watch
gulp.task('watch', function () {
    // Предварительная сборка проекта
    gulp.run('style');
    gulp.run('html');
    gulp.run('images');
    gulp.run('js');

    // Подключаем Livereload
    server.listen(35729, function (err) {
        if (err) return console.log(err);

        gulp.watch('assets/css/**/*.css', function () {
            gulp.run('css');
        });
        gulp.watch('assets/template/**/*.html', function () {
            gulp.run('html');
        });
        gulp.watch('assets/img/**/*', function () {
            gulp.run('images');
        });
        gulp.watch('assets/js/**/*', function () {
            gulp.run('js');
        });
    });
    gulp.run('http-server');
});