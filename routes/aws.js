const express = require('express');
const router = express.Router();
const aws = require('aws-sdk');

// aws configuration
aws.config.update({
	accessKeyId: process.env.ACCESSKEYID,
	secretAccessKey: process.env.SECRETACCESSKEY
});

// aws signedUrl endpoint
// this gets a temporary url from AWS and sends that url back to the client,
// which then makes a put request adding the image
router.get('/', function(req, res) {
	const {filename, filetype} = req.query;
	// init new s3 instance from aws sdk
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

module.exports = router;