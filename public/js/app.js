var app = angular.module('stockMarketApp', ['ui.bootstrap', 'ngCookies', 'ngRoute']);

app
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider
         .when('/', { templateUrl: 'features/home/views/home.html', controller: 'HomeCtrl' })
         .when('/login', { templateUrl: 'features/home/views/login.html', controller: 'LoginCtrl' })
         .when('/register', { templateUrl: 'features/home/views/register.html', controller: 'RegisterCtrl' })
         .when('/profile', { templateUrl: 'features/user/views/profile.html', controller: 'ProfileCtrl' })
         .when('/portfolio', { templateUrl: 'features/user/views/portfolio.html', controller: 'PortfolioCtrl' })
         .when('/findStock/:symbol', { templateUrl: 'features/home/views/findStock.html', controller: 'FindStockCtrl' })
         //.when('/findStock', { templateUrl: 'features/home/views/findStock.html', controller: 'FindStockCtrl' })
         .otherwise({ redirectTo: '/' });
    }])
    .run(function ($rootScope, $cookieStore, $location) {

        $rootScope.$on("$routeChangeStart", function (event, next, current) {
            if ($cookieStore.get('loggedUser') == null) {
                if (next.templateUrl == "features/home/views/findStock.html" || next.templateUrl == "features/home/views/login.html" || next.templateUrl == "features/home/views/home.html" || next.templateUrl == "features/home/views/register.html") {
                    
                } else {
                    $location.path("/login");
                }
            } else {
                if (next.templateUrl == "features/home/views/login.html" || next.templateUrl == "features/home/views/register.html") {
                    $location.path("/");
                }
            }
        });
    })