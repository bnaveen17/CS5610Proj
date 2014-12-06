angular.module('stockMarketApp').controller("LoginCtrl", function ($scope, $location, $cookieStore, $http, $rootScope) {
    $scope.login = function () {
        var loginUrl = '/api/checkIfValidUser?' + 'username=' + $scope.credentials.username + '&password=' + $scope.credentials.password;

        $http({ method: 'GET', url: loginUrl }).
        success(function (data, status, headers, config) {
            if (!data.isLoginError) {
                $rootScope.isUserLogged = true;
                $cookieStore.put('loggedUser', $scope.credentials.username);
                $cookieStore.put('isUserLogged', true);
                $scope.credentials.loginError = null;
                $location.path("/profile");
            } else {
                $scope.credentials.username = '';
                $scope.credentials.password = '';
                $scope.credentials.loginError = data.loginErrorMessage;
            }
        });
    }
});

angular.module('stockMarketApp').controller("HomeCtrl", function ($scope, $cookieStore, $location, $rootScope) {
    $rootScope.isUserLogged = $cookieStore.get('isUserLogged');
    if ($cookieStore.get('loggedUser')) {
        $scope.homeMessage = "Welcome user : " + $cookieStore.get('loggedUser');
    } else {
        $scope.homeMessage = "Not logged in";
    }
});

angular.module('stockMarketApp').controller("RegisterCtrl", function ($scope, $location, $cookieStore, $http) {
    $scope.registerUser = function () {

        if ($scope.register.password != $scope.register.retypePassword) {
            $scope.register.registerError = "Passwords do not match";
            $scope.register.password = '';
            $scope.register.retypePassword = '';
        } else {
            var registerUrl = '/api/createUser?' + 'username=' + $scope.register.username + '&password=' + $scope.register.password + '&email=' + $scope.register.email + '&firstname=' + $scope.register.firstName + '&lastname=' + $scope.register.lastName;

            $http({ method: 'POST', url: registerUrl }).
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

angular.module('stockMarketApp').controller("HeaderCtrl", function ($scope, $location, $cookieStore, $http, $rootScope) {
    $rootScope.isUserLogged = $cookieStore.get('isUserLogged');
    $scope.login = function () {
        var loginUrl = '/api/checkIfValidUser?' + 'username=' + $scope.credentials.username + '&password=' + $scope.credentials.password;

        $http({ method: 'GET', url: loginUrl }).
        success(function (data, status, headers, config) {
            if (!data.isLoginError) {
                $rootScope.isUserLogged = true;
                $cookieStore.put('loggedUser', $scope.credentials.username);
                $cookieStore.put('isUserLogged', true);
                $scope.credentials.loginError = null;
                $scope.credentials.username = '';
                $scope.credentials.password = '';
                $location.path("/profile");
            } else {
                $scope.credentials.username = '';
                $scope.credentials.password = '';
                $scope.credentials.loginError = data.loginErrorMessage;
            }
        });
    }

    $scope.logout = function () {
        $rootScope.isUserLogged = false;
        $cookieStore.put('loggedUser', null);
        $cookieStore.put('isUserLogged', false);
        $location.path("/");
    }
});



angular.module('stockMarketApp').controller("FindStockCtrl", function ($scope, $location, $cookieStore, $http, $rootScope, $routeParams) {
    var symbol = $routeParams.symbol;
    $scope.stockSymbol = symbol;
    getInputParams = function (symbol, duration) {
        return {
            Normalized: false,
            NumberOfDays: duration,
            DataPeriod: "Day",
            Elements: [
                {
                    Symbol: symbol,
                    Type: "price",
                    Params: ["c"]
                }
            ]
        }
    };

    getRequiredInfo = function (json) {
        var dates = json.Dates || [];
        var elements = json.Elements || [];
        var chartSeries = [];

        if (elements[0]) {

            for (var i = 0, dateLen = dates.length; i < dateLen; i++) {
                var date = new Date(dates[i]);
                date = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
                var pointData = [
                    date,
                    elements[0].DataSeries['close'].values[i]
                ];
                chartSeries.push(pointData);
            };
        }
        return chartSeries;
    };

    render = function (data, symbol) {
        var priceHistory = getRequiredInfo(data);
        $('#chartContainer').highcharts('StockChart', {
            rangeSelector: {
                selected: 1
            },

            title: {
                text: symbol + ' historical data'
            },
            xAxis: [{
                title: {
                    text: 'Date'
                }
            }],

            yAxis: [{
                title: {
                    text: 'Share Price per Unit(in USD)'
                },
                height: 200,
                lineWidth: 2
            }],

            series: [{
                type: 'areaspline',
                name: symbol,
                data: priceHistory
            }],

            credits: {
                enabled: false
            }
        });
    };

    var getChart = function () {
        var duration = 10950;
        symbol = symbol.toUpperCase();
        var params = {
            parameters: JSON.stringify(getInputParams(symbol, duration))
        }

        $.ajax({
            beforeSend: function () {
                $("#chartContainer").text("Loading chart");
            },
            data: params,
            url: "http://dev.markitondemand.com/Api/v2/InteractiveChart/jsonp",
            dataType: "jsonp",
            success: function (json) {
                if (!json || json.Message) {
                    console.error("Error: ", json.Message);
                    return;
                }
                render(json, symbol);
            },
            error: function (response, txtStatus) {
                console.log(response, txtStatus)
            }
        });
    };

    getChart();
})