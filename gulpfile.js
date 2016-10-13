"use strict";

var lr = require('tiny-lr'), // Минивебсервер для livereload
    gulp = require('gulp'),
    livereload = require('gulp-livereload'), // Livereload для Gulp
    csso = require('gulp-csso'), // Минификация CSS
    imagemin = require('gulp-imagemin'), // Минификация изображений
    uglify = require('gulp-uglify'), // Минификация JS
    concat = require('gulp-concat'), // Склейка файлов
    rigger = require('gulp-rigger'),
    less = require('gulp-less'),
    fileinclude  =  require('gulp-file-include'),
    connect = require('connect'),
    connect_static = require('serve-static'),
    connect_lv = require('connect-livereload'),
    server = lr(),
    request = require('request'),

    jwt = require('jwt-simple'),
    db = require('origindb')('db');

// CONFIG
var local_secret = 'NO_SECRET',
    facebook_secret = 'a3019816d4ccbd40d4dbea41c022297b';

// functions
var getUser = function (email) {
        var users = db('users').object();

        for (var id in users) {
            if (users[id].email === email) return users[id];
        }
        return false;
    },
    getUserByID = function (ID) {
        db('users').get(ID);
    },
    checkUser = function (email, password) {
        //
    };


gulp.task('default', function () {
    // place code for your default task 
    console.log("Hello World!");

    db('users').set('user_0', {
        id: 'user_0',
        provider: 'local',
        email: "test@mail.com",
        name: "Test Man",
        password: "password",
        picture: ''
    }).set('length', 1);

    console.log(getUser('test@mail.com'));
});

gulp.task('less', function () {
    return gulp.src('./assets/less/*.less')
        .pipe(less({
            paths: ['./node_modules/bootstrap/less']
        }))
        .pipe(gulp.dest('./assets/css'));
});

gulp.task('style', function () {
    gulp.src('./assets/css/**/*.css')
        .pipe(concat('style.css')) // собираем stylus
        .pipe(csso())
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
        /*.pipe(uglify({
			mangle: false
		}))*/
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
        .use('/auth', function (req, res, next) {
            switch (req.url) {
            case '/facebook':
                var data = '';
                req.on('data', function (chunk) {
                    data += chunk.toString();
                });
                req.on('end', function () {
                    data = JSON.parse(data);
                    var access_token_url = 'https://graph.facebook.com/v2.3/oauth/access_token',
                        graph_api_url = 'https://graph.facebook.com/v2.5/me?fields=id,name,picture,email',
                        params = {
                            client_id: data.clientId,
                            redirect_uri: data.redirectUri,
                            client_secret: facebook_secret,
                            code: data.code
                        },
                        access_token,
                        user_data = {},
                        payload = {
                            iss: 'local',
                            expires: Math.round((new Date().getTime() / 1000)) + 3600
                        };

                    request.get({
                        url: access_token_url,
                        useQuerystring: true,
                        qs: params
                    }, function (e, r, body) {
                        var access_token = JSON.parse(body);
                        request.get({
                            url: graph_api_url,
                            useQuerystring: true,
                            qs: access_token
                        }, function (e, r, body) {
                            var fb_res = JSON.parse(body),
                                count = db('users').get('length', 0),
                                user = getUser(fb_res.email);
                            console.log('User', fb_res, user, count);

                            if (!user) {
                                user = {
                                    id: 'user_' + count,
                                    provider: 'facebook',
                                    name: fb_res.name,
                                    email: fb_res.email,
                                    password: '',
                                    picture: '',
                                    facebook: {
                                        id: fb_res.id,
                                        token: access_token
                                    }
                                };
                                db('users').set('user_' + count, user);
                                db('users').set('length', count + 1)
                            } else {
                                // update user
                            }
                            res.writeHead(200);
                            res.write('hi');
                            res.end();
                        });
                    });
                });
                break;
            case '/login':
                var data = '';
                req.on('data', function (chunk) {
                    data += chunk.toString();
                });
                req.on('end', function () {
                    var post = JSON.parse(data || '{}'),
                        users = db('users').object(),
                        user = getUser(post.email),
                        user_data = {},
                        payload = {
                            iss: 'local',
                            expires: Math.round((new Date().getTime() / 1000)) + 3600
                        };

                    if (user && user.password === post.password) {
                        res.writeHead(200);
                        payload.ID = user.id;
                        user_data.name = user.name;
                        user_data.token = jwt.encode(payload, local_secret, 'HS256');
                        res.write(JSON.stringify(user_data));
                    } else {
                        res.writeHead(404);
                        res.write('{"error":"Wrong user or password"}');
                    }
                    res.end();
                });
                break;
            default:
                next();
            }
        })
        .use('/user', function (req, res, next) {
            if (Boolean(req.headers.authorization)) {
                var token = req.headers.authorization.split(' ')[1],
                    payload;
                try {
                    payload = jwt.decode(token, local_secret);
                    res.writeHead(200);
                    res.write(JSON.stringify(getUserByID(payload.ID)));
                } catch (error) {
                    console.log(error);
                    res.writeHead(401);
                }
                res.end();
            } else {
                res.writeHead(401);
                res.write('{"error":"Authorization header missing"}');
                res.end();
            }
        })
        .use(connect_lv())
        .use(connect_static('./public'))
        .listen('9000');

    console.log('Server listening on http://localhost:9000');
});

// Запуск сервера разработки gulp watch
gulp.task('watch', ['less', 'style', 'html', 'images', 'js', 'http-server'], function () {
    // Подключаем Livereload
    server.listen(35729, function (err) {
        if (err) return console.log(err);

        gulp.watch('assets/less/*.less', function () {
            gulp.run('less');
        });
        gulp.watch('assets/css/**/*.css', function () {
            gulp.run('style');
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
});