// we've separated out our app and server. `app`
// is responsible for coordinating routes and middleware.
// server is responsible for serving the app defined
// in this file.

const bodyParser = require('body-parser');
const express = require('express');
const morgan = require('morgan');

const tripsRouter = require('./routes/trips');
const memoriesRouter = require('./routes/memories');


// Set up the express app
const app = express();

app.use(morgan('common'));
app.use(bodyParser.json());

app.use('/trips', tripsRouter);
app.use('/memories', memoriesRouter);

app.use('*', function(req, res) {
	res.status(404).json({message: 'Not Found'});
});

module.exports = app;
