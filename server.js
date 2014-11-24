var express = require('express');
var app = express();
var mongoose = require('mongoose');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');

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

var appUser = mongoose.model('AppUsers', {
    username: String,
    password: String,
    firstName: String,
    lastName: String,
    email: String
});

// get all todos
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

app.get('/api/createUser', function (req, res) {
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


//app.get('/api/createUser', function (req, res) {
//    var isRegistrationError = false;
//    var registrationErrorMessage = null;
//    var dbConnectivityError = 'Error connecting to database';
//    appUser.findOne({ username: req.query.username }, function (err, data) {
//        if (err) {
//            console.log('Error4');
//            res.json({ isRegistrationError: true, registrationErrorMessage: dbConnectivityError });
//        }
//        if (data) {
//            console.log('Error3');
//            res.json({ isRegistrationError: true, registrationErrorMessage: 'This username is already registered' });
//        }

//        appUser.findOne({ email: req.query.email }, function (err, data) {
//            if (err) {
//                console.log('Error2');
//                res.json({ isRegistrationError: true, registrationErrorMessage: dbConnectivityError });
//            }
//            if (data) {
//                console.log('Error1');
//                res.json({ isRegistrationError: true, registrationErrorMessage: 'This email is already registered' });
//            }

//            var newUser = new appUser({
//                username: req.query.username,
//                password: req.query.password,
//                email: req.query.email,
//                firstName: req.query.firstName,
//                lastName: req.query.lastName
//            });

//            newUser.save(function (err, data) {
//                if (!err) {
//                    res.json({ isRegistrationError: false, registrationErrorMessage: null });
//                } else {
//                    res.json({ isRegistrationError: true, registrationErrorMessage: 'Error creating user' });
//                }
//            });
//        });
//    });
//});

app.all('*', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
});

app.listen(port, ipaddress);
console.log("App listening on port " + port);