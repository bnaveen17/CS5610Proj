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

function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    while (0 !== currentIndex) {

        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

angular.module('stockMarketApp').controller("HomeCtrl", function ($scope, $cookieStore, $location, $rootScope, $http, $sce) {

    $rootScope.isUserLogged = $cookieStore.get('isUserLogged');
    if ($cookieStore.get('loggedUser')) {
        $scope.homeMessage = "Welcome user : " + $cookieStore.get('loggedUser');
    } else {
        $scope.homeMessage = "Not logged in";
    }

    var techStocks = ['GOOG', 'AMZN', 'MSFT', 'FB'];
    var finStocks = ['BAC', 'WFC', 'GS', 'JPM'];
    var techNews = []
    var finNews = []

    for (stockNum = 0; stockNum < techStocks.length; stockNum++) {
        $http.get("/api/getStockNews?exchange=NASDAQ&ticker=" + techStocks[stockNum] + "&output=rss").success(function (response) {
            var jsonData = x2js.xml_str2json(response);
            newsItems = jsonData.rss.channel.item;

            for (i = 0; i < newsItems.length; i++) {
                techNews.push($sce.trustAsHtml(newsItems[i].description));
            }
        });
    }

    $scope.techNews = shuffle(techNews);

    for (stockNum = 0; stockNum < finStocks.length; stockNum++) {
        $http.get("/api/getStockNews?exchange=NYSE&ticker=" + finStocks[stockNum] + "&output=rss").success(function (response) {
            var jsonData = x2js.xml_str2json(response);
            newsItems = jsonData.rss.channel.item;

            for (i = 0; i < newsItems.length; i++) {
                finNews.push($sce.trustAsHtml(newsItems[i].description));
            }
        });
    }

    $scope.finNews = shuffle(finNews);

    $scope.getStocksForAutoComplete = function (enteredStock) {
        return $.ajax({
            data: { input: enteredStock },
            type: "GET",
            url: "http://dev.markitondemand.com/Api/v2/Lookup/jsonp",
            dataType: "jsonp",
            success: readData
        });

        function readData(data) {

            var output = [];

            data.forEach(function (stock) {
                output.push(stock.Name);
            });
            return output;
        }
    };

    $scope.gotoStockInfo = function() {
        $location.path("/findStock/" + $scope.stockToSearch.Symbol);
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



angular.module('stockMarketApp').controller("FindStockCtrl", function ($scope, $location, $cookieStore, $http, $rootScope, $routeParams, $sce) {
    var symbol = $routeParams.symbol;
    $scope.stockFound = false;
    $scope.stockNewsFound = false;
    $scope.orderByColumn = 'name';
    $scope.isReverseSort = false;
    $scope.stockSymbol = symbol;

    //$http.get("http://www.google.com/finance/company_news?q=nasdaq:" + symbol + "&output=rss").success(function (response) {
    //    console.log('aaaaaaaaaaaaaaaaaa')
    //    console.log(response);
    //    var jsondata = x2js.xml_str2json(response);
    //    console.log(jsondata);
    //    newsitems = jsondata.rss.channel.item;
    //    $scope.news = [];
        
    //    for (i = 0; i < newsitems.length; i++) {
    //        $scope.news.push($sce.trustashtml(newsitems[i].description));
    //    }
    //    $scope.stocknewsfound = true;
    //    getchart();
    //});

    $http.get("/api/getStockNews?exchange=NASDAQ&ticker=" + symbol + "&output=rss").success(function (response) {
        var jsonData = x2js.xml_str2json(response);
        newsItems = jsonData.rss.channel.item;
        $scope.news = [];

        for (i = 0; i < newsItems.length; i++) {
            $scope.news.push($sce.trustAsHtml(newsItems[i].description));
        }
        $scope.stockNewsFound = true;
        getChart();
    });
    
    
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
                
                $scope.stockFound = true;
                
                render(json, symbol);
            },
            error: function (response, txtStatus) {
                console.log(response, txtStatus)
            }
        });
    };
})

angular.module('stockMarketApp').directive('customThumbnail', function () {
    return {
        restrict: 'E',
        scope: false,
        templateUrl: 'features/home/views/customThumbnail.html'
    }
});