"use strict";
//angular.module('iWayApp', ['ui.router', 'ngStorage']);
angular
    .module('iWayApp', ['ui.router', 'ngStorage', 'satellizer'])
    .config(['$stateProvider', '$urlRouterProvider', '$authProvider', function ($stateProvider, $urlRouterProvider, $authProvider) {
        // default state

        $stateProvider.state('login', {
            url: '/login',
            templateUrl: '/pages/login.html',
            data: {
                'noLogin': true
            }
        });

        $stateProvider.state('profile', {
            url: '/profile',
            templateUrl: '/pages/profile.html'
        });

        $authProvider.facebook({
            clientId: '194950410944165',
            // by default, the redirect URI is http://localhost:5000
            redirectUri: location.origin + location.pathname
        });
    }])
    .controller('loginCtrl', ['$http', '$sessionStorage', '$rootScope', '$auth', '$scope', function ($http, $sessionStorage, $rootScope, $auth, $scope) {
        var $this = this;

        $this.login = function () {
            $auth
                .login({
                    email: $this.email,
                    password: $this.password
                })
                .then(function (response) {
                    console.log(response.data.token);
                    $auth.setToken(response.data.token);
                    $rootScope.$state.go('profile');
                })
                .catch(function (response) {
                    alert(response.data.error);
                    /*toastr.error(
                    	'Email or password not correct!', {
                    		closeButton: true
                    	}
                    );*/
                })
        };
        $scope.authenticate = function (provider) {
            $auth.authenticate(provider)
                .then(function (response) {
                    console.debug("success", response);
                    $rootScope.$state.go('profile');
                })
                .catch(function (response) {
                    console.log("catch", response);
                });
        };
    }])
    .controller('userCtrl', ['$http', '$sessionStorage', '$rootScope', '$auth', '$scope', function ($http, $sessionStorage, $rootScope, $auth, $scope) {
        var $this = this;

        $this.login = function () {
            $auth
                .login({
                    email: $this.email,
                    password: $this.password
                })
                .then(function (response) {
                    console.log(response);
                    //$auth.setToken(response);
                    $rootScope.$state.go('profile');
                })
                .catch(function (response) {
                    alert(response.data.error);
                    /*toastr.error(
                    	'Email or password not correct!', {
                    		closeButton: true
                    	}
                    );*/
                })
        };
        $scope.authenticate = function (provider) {
            $auth.authenticate(provider)
                .then(function (response) {
                    console.debug("success", response);
                    $rootScope.$state.go('profile');
                })
                .catch(function (response) {
                    console.log("catch", response);
                });
        };
    }])
    .service('SessionService', ['$injector', function ($injector) {
        "use strict";

        this.checkAccess = function (event, toState, toParams, fromState, fromParams) {
            var $scope = $injector.get('$rootScope'),
                $sessionStorage = $injector.get('$sessionStorage');

            if (toState.data !== undefined) {
                if (toState.data.noLogin !== undefined && toState.data.noLogin) {
                    // если нужно, выполняйте здесь какие-то действия 
                    // перед входом без авторизации
                }
            } else {
                // вход с авторизацией
                if ($sessionStorage.user) {
                    $scope.$root.user = $sessionStorage.user;
                } else {
                    // если пользователь не авторизован - отправляем на страницу авторизации
                    event.preventDefault();
                    $scope.$state.go('login');
                }
            }
        };
    }])
    .run(['$rootScope', '$state', '$stateParams', 'SessionService', '$http', function ($rootScope, $state, $stateParams, SessionService, $http) {
        $rootScope.$state = $state;
        $rootScope.$stateParams = $stateParams;

        $rootScope.$root.user = null;

        $http.get('/user')
            .then(function (response) {
                //$scope.user = response.data;
                console.log('Geted user', response.data)
                $rootScope.$state.go('profile');
            })
            .catch(function (response) {
                $rootScope.$state.go('login'); // We can show error message 'response.data.error' but we donn't
            });

        //$rootScope.$state.go('profile'); // By default open profile with user information

        // Здесь мы будем проверять авторизацию
        $rootScope.$on('$stateChangeStart',
            function (event, toState, toParams, fromState, fromParams, options) {
                SessionService.checkAccess(event, toState, toParams, fromState, fromParams);
            }
        );
    }]);