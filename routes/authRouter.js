const express = require('express');
const jsonParser = require('body-parser').json();
const passport = require('passport');
const {BasicStrategy} = require('passport-http');
const LocalStrategy = require('passport-local').Strategy;

const {User} = require('../models');

const router = express.Router();
router.use(jsonParser);

const localStrategy = new LocalStrategy(
	// manually set username and password fields
	{
		usernameField: 'userName',
		passwordField: 'password'
	},
	function(userName, password, done) {
		// user needs to be accessible to multiple .then() blocks,
		// so we've defined it in the parent scope
		let user;
		User
			.findOne({
				where: {
					'userName': userName
				}
			}).then(function(_user) {
				user = _user;
				// if no user exists, return "incorrect username"
				if (!user) {
					return done(null, false, {message: 'Incorrect username'});
				}
				// else, call validatePassword, which returns a boolean
				return user.validatePassword(password);
			}).then(function(isValid) {
				if (!isValid) {
					return done(null, false, {message: 'Incorrect password'});
				} else {
					return done(null, user);
				}
			});
	}
);

passport.serializeUser(function(user, done) {
	done(null, user);
});

passport.deserializeUser(function(user, done) {
	done(null, user);
});

router.use(passport.initialize());
passport.use(localStrategy);

router.post('/',
	passport.authenticate('local', { 
		successRedirect: '/trips',
		failureRedirect: '/',
		failureFlash: true
	})
);

module.exports = router;