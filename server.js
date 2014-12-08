var express = require('express');
var app = express();
var mongoose = require('mongoose');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var request = require('request');
var async = require("async");
var http = require("http");


var dbName = "cs5610proj";
var databaseUrl;
if (process.env.OPENSHIFT_MONGODB_DB_HOST) {
    databaseUrl = process.env.OPENSHIFT_MONGODB_DB_URL + dbName;
} else {
    databaseUrl = 'mongodb://localhost/' + dbName;
}

mongoose.connect(databaseUrl);


var ipaddress = process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1";
var port = process.env.OPENSHIFT_NODEJS_PORT || 4000;


app.use(express.static(__dirname + '/public'));

app.use(morgan('dev'));                        
app.use(bodyParser.urlencoded({ 'extended': 'true' }));            
app.use(bodyParser.json());                                     
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); 
app.use(methodOverride());

var appUser = mongoose.model('appusers', {
    username: String,
    password: String,
    firstName: String,
    lastName: String,
    email: String
});

app.get('/api/checkIfValidUser', function (req, res) {

    appUser.findOne({ username: req.query.username }, function (err, data) {
        if (data) {
            var retrievedPwd = data.password;
            if (req.query.password == retrievedPwd) {
                res.json({ isLoginError: false, loginErrorMessage: null });
            } else {
                res.json({ isLoginError: true, loginErrorMessage: 'Invalid password' });
            }
        } else {
            res.json({ isLoginError: true, loginErrorMessage: 'This username is not registered' });
        }
    });
});

app.post('/api/createUser', function (req, res) {
    var isRegistrationError = false;
    var registrationErrorMessage = null;

    appUser.findOne({ email: req.query.email }, function (err, data) {
        if (data) {
            isRegistrationError = true;
            registrationErrorMessage = 'This email is already registered';
        }

        appUser.findOne({ username: req.query.username }, function (err, data) {

            if (data) {
                isRegistrationError = true;
                registrationErrorMessage = 'This username is already registered';
            }

            if (isRegistrationError) {
                res.json({ isRegistrationError: true, registrationErrorMessage: registrationErrorMessage });
            } else {

                var newUser = new appUser({
                    username: req.query.username,
                    password: req.query.password,
                    email: req.query.email,
                    firstName: req.query.firstname,
                    lastName: req.query.lastname
                });

                newUser.save(function (err, data) {
                    res.json({ isRegistrationError: false, registrationErrorMessage: null });
                });
            }
        });
    });
});

app.get('/api/getUserInfo', function (req, res) {

    appUser.findOne({ username: req.query.username }, function (err, data) {
        if (data) {
            res.json({isRetrieveError: false, userInfo: data});
        }
        if (err) {
            res.json({ isRetrieveError: true, userInfo: null });
        }
    });
});

var portfolio = mongoose.model('portfolio', {
    username: String,
    stockName: String,
    stockTicker: String,
    quantity: Number,
    boughtDate: Date,
    boughtPrice: Number,
    entryDate: Date,
    note: String
});

app.post('/api/addStockToPortfolio', function (req, res) {
            
    var newStock = new portfolio({
        username: req.query.username,
        stockName: req.query.stockName,
        stockTicker: req.query.stockTicker,
        quantity: req.query.quantity,
        boughtDate: req.query.boughtDate,
        boughtPrice: req.query.boughtPrice,
        entryDate: Date.now(),
        note: req.query.note
    });

    newStock.save(function (err, data) {
        if(err) {
            res.json({ isStockAddError: true, stockAddErrorMessage: 'Error connecting to DB' });
        }

        if(data) {
            res.json({ isStockAddError: false, stockAddErrorMessage: null });
        }
    });
});

app.get('/api/getUserPortfolio', function (req, res) {

    portfolio.find({ username: req.query.username }, function (err, data) {
        if (data) {
            var userPortfolio = data;
            var outputPortfolio = [];
            var tickers = [];
            for (stockCounter = 0; stockCounter < userPortfolio.length; stockCounter++) {
                var stockName = userPortfolio[stockCounter].stockName;
                var stockTicker = userPortfolio[stockCounter].stockTicker;
                var quantity = userPortfolio[stockCounter].quantity;
                var boughtPrice = userPortfolio[stockCounter].boughtPrice;
                var boughtDate = userPortfolio[stockCounter].boughtDate;
                var note = userPortfolio[stockCounter].note;
                var entryDate = userPortfolio[stockCounter].entryDate;
                var stockHistory = { quantity: quantity, boughtPrice: boughtPrice, boughtDate: boughtDate, note: note, entryDate: entryDate };
                var tickerIndex = tickers.indexOf(stockTicker);
                var stock = null;
                if (tickerIndex <= -1) {
                    stock = { stockName: stockName, stockTicker: stockTicker, quantity: quantity, boughtPrice: boughtPrice, stockHistory: [stockHistory] };                    
                    outputPortfolio.push(stock);
                    tickers.push(stockTicker);
                } else {
                    var retrievedStock = outputPortfolio[tickerIndex];
                    var retrievedHistory = retrievedStock.stockHistory;
                    var totalQuantity = quantity;
                    var totalSum = quantity * boughtPrice;

                    for (i = 0; i < retrievedHistory.length; i++) {
                        totalQuantity = totalQuantity + retrievedHistory[i].quantity;
                        totalSum = totalSum + (retrievedHistory[i].quantity * retrievedHistory[i].boughtPrice);
                    }
                    var avgBoughtPrice = totalSum / totalQuantity;
                    avgBoughtPrice = avgBoughtPrice.toFixed(2);
                    retrievedHistory.push(stockHistory);
                    stock = { stockName: stockName, stockTicker: stockTicker, quantity: totalQuantity, boughtPrice: avgBoughtPrice, stockHistory: retrievedHistory };
                    outputPortfolio[tickerIndex] = stock;
                }

                
            }

            function getStockInfo(item, callback) {
                var url = 'http://dev.markitondemand.com/Api/v2/Quote/jsonp?symbol=' + item + '&callback=abc';
                request(url, function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        var jsonpData = body;
                        var json;
                        try {
                            json = JSON.parse(jsonpData);
                        }
                        catch (e) {
                            var startPos = jsonpData.indexOf('(function({');
                            var endPos = jsonpData.indexOf('})');
                            var jsonString = jsonpData.substring(startPos + 5, endPos + 1);
                            json = JSON.parse(jsonString);
                        }
                        callback(null, [json.LastPrice, json.ChangePercent, json.Change]);
                    } else {
                        callback(error);
                    }
                })
            }

            async.map(tickers,
                getStockInfo,
                function (err, lastPrices) {
                    if (!err) {
                        for (stockCounter = 0; stockCounter < outputPortfolio.length; stockCounter++) {
                            outputPortfolio[stockCounter].lastPrice = lastPrices[stockCounter][0];
                            outputPortfolio[stockCounter].changePercent = (lastPrices[stockCounter][1]).toFixed(2);
                            outputPortfolio[stockCounter].totalDayChange = (outputPortfolio[stockCounter].quantity * lastPrices[stockCounter][2]).toFixed(2);
                            outputPortfolio[stockCounter].overallChange = ((outputPortfolio[stockCounter].quantity * (lastPrices[stockCounter][0] - outputPortfolio[stockCounter].boughtPrice))).toFixed(2);
                        }
                        res.json({ isRetrieveError: false, userPortfolio: outputPortfolio });
                    } else {
                        res.json({ isRetrieveError: true, userPortfolio: null });
                    }
                });            
        }
    });
});

app.delete('/api/deleteStockFromPortfolio', function (req, res) {

    portfolio.find({ username: req.query.username, stockTicker: req.query.stockTicker }).remove(function (err, result) {
        if (err) {
            res.json({ isStockDeleteError: true, stockDeleteErrorMessage: 'Unable to delete stock. Contact admin' });
        } else {
            res.json({ isStockDeleteError: false, stockDeleteErrorMessage: null });
        }
    })
});

app.put('/api/editStockHistory', function (req, res) {

    var change = {quantity: req.query.quantity, boughtPrice: req.query.boughtPrice, note:req.query.note}
    var query = { username: req.query.username, stockTicker: req.query.stockTicker, entryDate: req.query.entryDate };
    portfolio.findOneAndUpdate(query, change, function(err, data) {
        if (err) {
            res.json({ isEditHistoryError: true, editHistoryErrorMessage: 'Unable to edit stock history. Contact admin' });
        } else {
            res.json({ isEditHistoryError: false, editHistoryErrorMessage: null });
        }
    })
});


app.get('/api/getStockNews', function (req, res) {
    
    url = "http://www.google.com/finance/company_news?q=NASDAQ:" + req.query.ticker + "&output=rss"


    var options = {
        host: 'www.google.com',
        port: 80,
        path: '/finance/company_news?q=nasdaq:goog&output=rss'
    };

    res.writeHead(200, {
        'Content-Type': 'text/xml'
    });
    var req = http.get(url, function (resp) {
        console.log("Got response: " + resp.statusCode);

        resp.on("data", function (chunk) {
            res.write(chunk);
        })

        resp.on("end", function () {
            res.end();
        });
    }).on('error', function (e) {
        console.log("Got error: " + e.message);
    });    

});



app.all('*', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
});

app.listen(port, ipaddress);
console.log("App listening on port " + port);