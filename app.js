// we've separated out our app and server. `app`
// is responsible for coordinating routes and middleware.
// server is responsible for serving the app defined
// in this file.

const bodyParser = require('body-parser');
const express = require('express');
const morgan = require('morgan');

const usersRouter = require('./routes/users');
const tripsRouter = require('./routes/trips');
const memoriesRouter = require('./routes/memories');


// Set up the express app
const app = express();

app.use(morgan('common'));
app.use(bodyParser.json());

// allow cross origin requests
app.use(function(req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
	next();
});

app.use('/users', usersRouter);
app.use('/trips', tripsRouter);
app.use('/memories', memoriesRouter);

app.use('*', function(req, res) {
	res.status(404).json({message: 'Not Found'});
});

module.exports = app;
