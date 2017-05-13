// separated out the app and server. `app`
// is responsible for coordinating routes and middleware.
// server is responsible for serving the app defined
// in this file.

const morgan = require('morgan');
const bodyParser = require('body-parser');
const express = require('express');
const passport = require('passport');

const usersRouter = require('./routes/users');
const tripsRouter = require('./routes/trips');
const memoriesRouter = require('./routes/memories');
const awsRouter = require('./routes/aws');
const authRouter = require('./routes/authRouter');

const app = express();

// middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(morgan('common'));
app.use(passport.initialize());


// allow cross origin requests
app.use(function(req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
	next();
});

// app routes
app.use('/users', usersRouter);
app.use('/trips', tripsRouter);
app.use('/memories', memoriesRouter);
app.use('/awsUrl', awsRouter);
app.use('/login', authRouter);

// 404 catchall
app.use('*', function(req, res) {
	res.status(404).json({message: 'Not Found'});
});

module.exports = app;
