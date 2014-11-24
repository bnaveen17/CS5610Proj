var app = angular.module('stockMarketApp', ['ngCookies']);

app
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider
         .when('/', { templateUrl: 'views/home.html', controller: 'HomeCtrl' })
         .when('/login', { templateUrl: 'views/login.html', controller: 'LoginCtrl' })
         .when('/register', { templateUrl: 'views/register.html', controller: 'RegisterCtrl' })
         .otherwise({ redirectTo: '/' });
    }])
    .run(function ($rootScope, $cookieStore, $location) {

        $rootScope.$on("$routeChangeStart", function (event, next, current) {
            if ($cookieStore.get('loggedUser') == null) {
                if (next.templateUrl == "views/login.html" || next.templateUrl == "views/home.html" || next.templateUrl == "views/register.html" || next.templateUrl == "views/forgotpassword.html") {
                    
                } else {
                    $location.path("/login");
                }
            } else {
                if (next.templateUrl == "views/login.html" || next.templateUrl == "views/register.html" || next.templateUrl == "views/forgotpassword.html") {
                    $location.path("/");
                }
            }
        });
    });

app.controller("LoginCtrl", function ($scope, $location, $cookieStore, $http) {
    $scope.login = function () {

        var loginUrl = '/api/checkIfValidUser?' + 'username=' + $scope.credentials.username + '&password=' + $scope.credentials.password;

        $http({ method: 'GET', url: loginUrl }).
        success(function (data, status, headers, config) {
            if (!data.isLoginError) {
                $cookieStore.put('loggedUser', $scope.credentials.username);
                $cookieStore.put('isUserLogged', true);
                $scope.credentials.loginError = null;
                $location.path("/");
            } else {
                $scope.credentials.username = '';
                $scope.credentials.password = '';
                $scope.credentials.loginError = data.loginErrorMessage;
            }
        });
    }
});

app.controller("HomeCtrl", function ($scope, $cookieStore, $location) {
    $scope.isUserLogged = $cookieStore.get('isUserLogged');
    if ($cookieStore.get('loggedUser')) {
        $scope.homeMessage = "Welcome user : " + $cookieStore.get('loggedUser');
    } else {
        $scope.homeMessage = "Not logged in";
    }

    $scope.logout = function () {
        console.log
        $cookieStore.put('loggedUser', null);
        $cookieStore.put('isUserLogged', false);
        $location.path("/login");
    };
});

app.controller("RegisterCtrl", function ($scope, $location, $cookieStore, $http) {
    $scope.registerUser = function () {

        if ($scope.register.password != $scope.register.retypePassword) {
            $scope.register.registerError = "Passwords do not match";
            $scope.register.password = '';
            $scope.register.retypePassword = '';
        } else {
            var registerUrl = '/api/createUser?' + 'username=' + $scope.register.username + '&password=' + $scope.register.password + '&email=' + $scope.register.email + '&firstname=' + $scope.register.firstName + '&lastname=' + $scope.register.lastName;

            $http({ method: 'GET', url: registerUrl }).
            success(function (data, status, headers, config) {
                if (!data.isRegistrationError) {
                    $cookieStore.put('loggedUser', $scope.register.username);
                    $cookieStore.put('isUserLogged', true);
                    $scope.register.registerError = null;
                    $location.path("/");
                } else {
                    $scope.register.registerError = data.registrationErrorMessage;
                }
            });
        }
    }
});