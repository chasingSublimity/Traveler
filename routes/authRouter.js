const express = require('express');
const jsonParser = require('body-parser').json();
const passport = require('passport');
const {BasicStrategy} = require('passport-http');
const LocalStrategy = require('passport-local').Strategy;

const {User} = require('../models');

const router = express.Router();
router.use(jsonParser);

const basicStrategy = new BasicStrategy(function(username, password, callback) {
	let user;
	User
		.findOne({
			where: {
				'userName': username
			} 
		})
		.then(_user => {
			user = _user;
			if (!user) {
				return callback(null, false, {message: 'Incorrect username'});
			}
			return user.validatePassword(password);
		}).then(isValid => {
			if (!isValid) {
				return callback(null, false, {message: 'Incorrect password'});
			} else {
				return callback(null, user);
			}
		});
});

passport.use(basicStrategy);
router.use(passport.initialize());


router.post('/', function(req, res, next) {
	passport.authenticate('basic', function(err, user, info) {
		if (err) { return next(err); }
			// Redirect if it fails
		if (!user) { return res.redirect('/'); }
		req.logIn(user, function(err) {
			if (err) { return next(err); }
			// Redirect if it succeeds
			return res.redirect('/trips');
		});
	})(req, res, next);
});

module.exports = router;