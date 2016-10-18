"use strict";
//angular.module('iWayApp', ['ui.router', 'ngStorage']);
angular
	.module('iWayApp', ['ui.router', 'ngStorage', 'satellizer', 'ngAnimate', 'ui.bootstrap'])
	.config(['$stateProvider', '$urlRouterProvider', '$authProvider', function ($stateProvider, $urlRouterProvider, $authProvider) {
		// default state

		$stateProvider.state('login', {
			url: '/login',
			templateUrl: '/pages/login.html',
			data: {
				'noLogin': true
			}
		});

		$stateProvider.state('logout', {
			url: '/logout',
			template: '<h1>Buy</h1>',
			controller: ['$auth', '$state', '$sessionStorage', function ($auth, $state, $sessionStorage) {
				$auth.logout();
				$sessionStorage.user = false;
				$state.go('login');
			}]
		});

		$stateProvider.state('nutritionix', {
			url: '/nutritionix',
			templateUrl: '/pages/nutritionix.html'
		});
		$stateProvider.state('foodlog', {
			url: '/foodlog',
			templateUrl: '/pages/foodlog.html'
		});

		$stateProvider.state('profile', {
			url: '/profile',
			templateUrl: '/pages/profile.html'
		});

		$stateProvider.state('profile_edit', {
			url: '/profile/edit',
			templateUrl: '/pages/profile_editor.html'
		});

		$authProvider.facebook({
			clientId: '1671085129869272',
			scope: ['email', 'user_posts'],
			// by default, the redirect URI is http://localhost:5000
			redirectUri: location.origin + location.pathname
		});

		$urlRouterProvider.otherwise('/profile');
    }])
	.controller('loginCtrl', ['$http', '$sessionStorage', '$state', '$auth', '$scope', function ($http, $sessionStorage, $state, $auth, $scope) {
		var $this = this;

		console.log('loginCtrl', $sessionStorage.user);
		if ($sessionStorage.user) {
			$state.go('profile');
			return;
		}
		$this.login = function () {
			$auth
				.login({
					email: $this.email,
					password: $this.password
				})
				.then(function (response) {
					$auth.setToken(response.data.token);
					$state.go('profile');
					$scope.logined = true;
				})
				.catch(function (response) {
					alert(response.data.error);
				})
		};
		$scope.authenticate = function (provider) {
			$auth.authenticate(provider)
				.then(function (response) {
					$auth.setToken(response.data.token);
					$state.go('profile');
					$scope.logined = true;
				})
				.catch(function (response) {
					console.log("catch", response);
				});
		};
    }])
	.controller('userCtrl', ['$http', '$sessionStorage', '$state', '$auth', '$scope', function ($http, $sessionStorage, $state, $auth, $scope) {
		var $this = this;

		$this.user = $sessionStorage.user;
		if (!$sessionStorage.user) {
			$http
				.get('/user')
				.then(function (response) {
					$this.user = $sessionStorage.user = response.data;
				})
				.catch(function (response) {
					//alert(response.data.error);
					$state.go('login'); // We can show error message 'response.data.error' but we donn't
				});
		}
		if ($scope.logined) {
			$state.go('profile');
		}

		$this.saveUser = function () {
			$http
				.post('/user/save', {
					name: $this.user.name,
					status: $this.user.status
				})
				.then(function (response) {
					$this.user = $sessionStorage.user = response.data;
					$state.go('profile');
				})
				.catch(function (response) {
					console.log(response);
				})
		}
	}])
	.controller('menuCollapseCtrl', ['$scope', '$sessionStorage', function ($scope, $sessionStorage) {
		console.log('menuCollapseCtrl');
		$scope.isNavCollapsed = true;
		$scope.logined = Boolean($sessionStorage.user);
	}])
	.controller('nutritionixCtrl', ['$state', '$http', '$localStorage', function ($state, $http, $localStorage) {
		// Nutritionix
		var $this = this;
		$this.results = {
			results: []
		};
		$this.loading = false;

		if (!$localStorage.foods)
			$localStorage.foods = {
				count: 0,
				items: {}
			};
		$this.foods = $localStorage.foods;
		//   search product
		$this.search = function () {
			$this.loading = true;
			$http
				.post('/nutritionix/search', {
					query: $this.query
				})
				.then(function (response) {
					$this.loading = false;
					$this.results = response.data;
				})
				.catch(function (err) {
					$this.loading = false;
				});
		};
		//   add product to FoodLog
		$this.add = function (item) {
			if (!$localStorage.foods.items[item.item.resource_id]) {
				$localStorage.foods.items[item.item.resource_id] = item.item;
				$localStorage.foods.count++;
			}
			$this.foods = $localStorage.foods;
		};
		$this.hide = function (item) {
			delete $localStorage.foods.items[item.item.resource_id];
			$localStorage.foods.count--;
			$this.foods = $localStorage.foods;
		};
		//   edit product in FoodLog
	}])
	.run(['$rootScope', '$state', '$auth', '$sessionStorage', function ($rootScope, $state, $auth, $sessionStorage) {
		// Здесь мы будем проверять авторизацию
		$rootScope.$on('$stateChangeStart',
			function (event, toState) {
				var requiredLogin = true;
				if (toState.data && toState.data.noLogin)
					requiredLogin = false;

				if (requiredLogin && !$auth.isAuthenticated()) {
					$sessionStorage.user = false;
					event.preventDefault();
					$state.go('login');
				}
			});
    }]);