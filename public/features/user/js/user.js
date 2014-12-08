angular.module('stockMarketApp').controller("ProfileCtrl", function ($scope, $location, $cookieStore, $http) {
    var username = $cookieStore.get('loggedUser')
    $http({ method: 'GET', url: '/api/getUserInfo?' + 'username=' + username }).
    success(function (data, status, headers, config) {
        if (!data.isRetrieveError) {
            $scope.userInfo = data.userInfo;
            $scope.firstName = data.userInfo.firstName;
        } else {
        }
    });
    $scope.updateProfile = function () {

    };
});

var getUserPortfolio = function (username, $http, $scope) {
    $scope.pieStocks = [];
    $http({ method: 'GET', url: '/api/getUserPortfolio?' + 'username=' + username }).
    success(function (data, status, headers, config) {
        if (!data.isRetrieveError) {
            $scope.portfolio = data.userPortfolio;
            $scope.todayProfit = 0;
            $scope.overallProfit = 0;
            for (stockNum = 0; stockNum < $scope.portfolio.length; stockNum++) {
                var boughtPrice = 0;
                var quantity = 0;
                if ($scope.portfolio[stockNum].boughtPrice) {
                    boughtPrice = $scope.portfolio[stockNum].boughtPrice;
                }
                if ($scope.portfolio[stockNum].quantity) {
                    quantity = $scope.portfolio[stockNum].quantity;
                }
                $scope.pieStocks.push([$scope.portfolio[stockNum].stockName, boughtPrice * quantity]);
                $scope.todayProfit = $scope.todayProfit + parseInt($scope.portfolio[stockNum].totalDayChange);
                $scope.overallProfit = $scope.overallProfit + parseInt($scope.portfolio[stockNum].overallChange);
            }
        } else {
        }
    });
}

angular.module('stockMarketApp').controller("PortfolioCtrl", function ($scope, $cookieStore, $http, $modal, $route) {
    var username = $cookieStore.get('loggedUser');
    $scope.addStock = {};
    
    getUserPortfolio(username, $http, $scope);
    $scope.openAddStockDialog = function () {
        var modalInstance = $modal.open({
            templateUrl: 'features/user/views/addStockModalCalendar.html',
            controller: 'AddStockModalCtrl'
        });
    };

    $scope.viewHistory = function (stock) {
        var modalInstance = $modal.open({
            templateUrl: 'features/user/views/viewHistoryModal.html',
            controller: 'ViewHistoryModalCtrl',
            resolve: {
                stock: function () {
                    return stock;
                }
            }
        });
    };

    $scope.deleteStock = function (stockTicker) {
        
        var deleteStockUrl = '/api/deleteStockFromPortfolio?' + 'username=' + username + '&stockTicker=' + stockTicker;
        $http({ method: 'DELETE', url: deleteStockUrl }).
          success(function (data, status, headers, config) {
              $route.reload();
          }).error(function (data, status, headers, config) {
          });
    };

    $scope.editStockInPortfolio = function () {

    };
});

angular.module('stockMarketApp').controller('AddStockModalCtrl', function ($scope, $modalInstance, $timeout, $cookieStore, $http, $location, $route) {
    var username = $cookieStore.get('loggedUser');
    $scope.addStock = {};
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

    var today = new Date();
    $scope.maxDate = today;
    today.setDate(today.getDate() - 365);
    $scope.minDate = ((today.getMonth() + 1) + '/' + today.getDate() + '/' + today.getFullYear());

    $scope.end = new Date();
    $scope.minDate = new Date('11/20/13');
    $scope.maxDate = new Date();
    $scope.openEnd = function () {
        $timeout(function () {
            $scope.isOpened = true;
        });
    };
    $scope.dateOptions = {
        'year-format': "'yy'",
        'starting-day': 1
    };
    
    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };

    var resetAddStockModal = function () {
        $scope.addStock.stockName = "";
        $scope.addStock.quantity = "";
        $scope.addStock.boughtPrice = "";
        $scope.addStock.boughtDate = "";
        $scope.addStock.note = "";
    }

    $scope.addStockToPortfolio = function () {
        if (!$scope.addStock || jQuery.isEmptyObject($scope.addStock)) {
            $scope.addStock.addErrorMessage = "Form cannot be empty";
            return;
        }
        if ($scope.addStock.stockName.Name && $scope.addStock.stockName.Symbol) {
            console.log(1);
            if (!$scope.addStock.quantity) {
                $scope.addStock.addErrorMessage = "Quantity cannot be empty";
                return;
            }
            console.log(2);
            if (isNaN($scope.addStock.quantity)) {
                $scope.addStock.addErrorMessage = "Quantity must be a number";
                return;
            } else {
                $scope.addStock.quantity = (parseInt($scope.addStock.quantity)).toString();
            }

            console.log(3)
            if (!$scope.addStock.boughtPrice) {
                $scope.addStock.addErrorMessage = "Price cannot be empty";
                return;
            }

            if (isNaN($scope.addStock.boughtPrice)) {
                $scope.addStock.addErrorMessage = "Price must be a number";
                return;
            } else {
                $scope.addStock.boughtPrice = (parseInt($scope.addStock.boughtPrice)).toString();
            }

            if (!$scope.addStock.boughtDate) {
                $scope.addStock.addErrorMessage = "Bought date cannot be empty";
                return;
            }

            var boughtDate = new Date($scope.addStock.boughtDate);
            var boughtDateInMilliSeconds = boughtDate.getTime();
            var stockNote = ' ';
            if ($scope.addStock.note) {
                stockNote = $scope.addStock.note;
            }
            var addStockUrl = '/api/addStockToPortfolio' + '?username=' + username + '&stockName=' + $scope.addStock.stockName.Name + '&stockTicker=' + $scope.addStock.stockName.Symbol + '&quantity=' + $scope.addStock.quantity + '&boughtPrice=' + $scope.addStock.boughtPrice + '&note=' + stockNote + '&boughtDate=' + boughtDateInMilliSeconds;
            addStockUrl = encodeURI(addStockUrl);
            $http({ method: 'POST', url: addStockUrl }).
                success(function (data, status, headers, config) {
                    if (!data.isStockAddError) {
                        $modalInstance.close();
                        $route.reload();
                    } else {
                        $scope.addStock.addErrorMessage = data.stockAddErrorMessage;
                    }
                });
        } else {
            $scope.addStock.addErrorMessage = "Invalid stock entered";
            resetAddStockModal();
        }
    };
});

angular.module('stockMarketApp').controller('ViewHistoryModalCtrl', function ($scope, $modalInstance, $timeout, $cookieStore, $http, $location, stock, $route) {
    var username = $cookieStore.get('loggedUser');
    $scope.stock = stock;
    $scope.changeBackup = {};
    $scope.editing = false;
    $scope.entry = {};

    $scope.editStock = function (index, entry) {
        $scope.entry = entry;
        $scope.editing = index;
        $scope.changeBackup = angular.copy($scope.stock.stockHistory[index]);
    }

    $scope.saveChanges = function () {
        if ($scope.editing !== false) {
            var editedQuantity = $scope.entry.quantity;
            var editedBoughtPrice = $scope.entry.boughtPrice;
            var editedNote = $scope.entry.note;
            if (!editedQuantity || isNaN(editedQuantity)) {
                if (!editedQuantity) {
                    $scope.editErrorMessage = 'Quantity cannot be empty';
                }
                if (isNaN(editedQuantity)) {
                    $scope.editErrorMessage = 'Quantity should be a number';
                }
                $scope.editErrorClass = "alert alert-danger";
                $scope.editMode = false;
                $scope.stock.stockHistory[$scope.editing] = $scope.changeBackup;
                return;
            }
            if (!editedBoughtPrice || isNaN(editedBoughtPrice)) {
                if (!editedBoughtPrice) {
                    $scope.editErrorMessage = 'Price cannot be empty';
                }
                if (isNaN(editedBoughtPrice)) {
                    $scope.editErrorMessage = 'Price should be a number';
                }
                $scope.editErrorClass = "alert alert-danger";
                $scope.editMode = false;
                $scope.stock.stockHistory[$scope.editing] = $scope.changeBackup;
                return;
            }
            var editUrl = '/api/editStockHistory?username=' + username + '&stockTicker=' + stock.stockTicker + '&quantity=' + editedQuantity + '&boughtPrice=' + editedBoughtPrice + '&note=' + editedNote + '&entryDate=' + $scope.changeBackup.entryDate;
            editUrl = encodeURI(editUrl);
            $http({ method: 'PUT', url: editUrl }).
            success(function (data, status, headers, config) {
                if (!data.isEditHistoryError) {
                    $scope.editErrorMessage = "Edited successfully";
                    $scope.editErrorClass = "alert alert-success";
                } else {
                    $scope.editErrorMessage = data.editHistoryErrorMessage;
                    $scope.editErrorClass = "alert alert-danger";
                }
                $scope.editing = false;
            });
        }
    };

    $scope.cancelEdit = function () {
        if ($scope.editing !== false) {
            $scope.stock.stockHistory[$scope.editing] = $scope.changeBackup;
            $scope.editing = false;
        }
    };
    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
        $route.reload();
    };
});

angular.module('stockMarketApp').directive('pieChart', function () {
    return {
        restrict: 'C',
        scope: {
            items: '='
        },
        template: '<div id="container" style="margin: 0 auto">not working</div>',
        link: function (scope, element, attrs) {
            var chart = new Highcharts.Chart({
                chart: {
                    renderTo: 'container',
                    plotBackgroundColor: null,
                    plotBorderWidth: null,
                    plotShadow: false
                },
                title: {
                    text: 'Portfolio split-up by Stocks'
                },
                tooltip: {
                    pointFormat: '{series.name}: <b>{point.percentage}%</b>',
                    percentageDecimals: 1
                },
                plotOptions: {
                    pie: {
                        size: '50%',
                        allowPointSelect: true,
                        cursor: 'pointer',
                        dataLabels: {
                            enabled: true,
                            color: '#000000',
                            connectorColor: '#000000',
                            formatter: function () {
                                return '<b>' + this.point.name + '</b>: ' + this.percentage.toFixed(2) + ' %';
                            }
                        }
                    }
                },
                series: [{
                    type: 'pie',
                    name: 'Portfolio value',
                    data: scope.items
                }]
            });
            scope.$watch("items", function (newValue) {
                chart.series[0].setData(newValue, true);
            }, true);
        }
    }
});
angular.module('stockMarketApp').directive('portfolioOverview', function(){
    return {
        restrict: 'E',
        scope: false,
        templateUrl: 'features/user/views/portfolioOverview.html'
    }
});

angular.module('stockMarketApp').filter('customCurrency', ["$filter", function ($filter) {
    return function (amount, currencySymbol) {
        var currency = $filter('currency');

        if (amount < 0) {
            return currency(amount, currencySymbol).replace("(", "-").replace(")", "");
        }

        return currency(amount, currencySymbol);
    };
}]);