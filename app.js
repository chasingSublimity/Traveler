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

// aws import and configuration
var aws = require('aws-sdk');
aws.config.update({
    accessKeyId: process.env.ACCESSKEYID,
    secretAccessKey: process.env.SECRETACCESSKEY
});


// Set up the express app
const app = express();

app.use(morgan('common'));
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

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

// aws signedUrl endpoint
app.get('/awsUrl', function(req, res) {
	const {filename, filetype} = req.query;
	console.log(filename, filetype);
	var s3 = new aws.S3();

	var params = {
		Bucket: 'traveler-images',
		Key: filename,
		Expires: 60,
		ContentType: filetype
	};

	s3.getSignedUrl('putObject', params, function(err, data) {
		if (err) {
			console.log(err);
			return err;
		} else {
			res.json({signedUrl: data});
		}
	});
});

app.use('*', function(req, res) {
	res.status(404).json({message: 'Not Found'});
});

module.exports = app;
