const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt-nodejs');

const {User} = require('../models/index');

// hash password
function generateHash(password) {
	return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
}

router.post('/', (req, res) => {
	let {userName, password, firstName, lastName} = req.body;

	const hash = generateHash(password);
	return User.create({
		firstName: firstName,
		lastName: lastName,
		userName: userName,
		password: hash
	})
	.then(user => {
		// send back apirRepr data
		return res.status(201).json(user.apiRepr());
	})
	// error handling
	.catch(err => {
		if (err.name === 'AuthenticationError') {
			return res.status(422).json({message: err.message});
		}
		res.status(500).json({message: 'Internal server error'});
	});
});

// update a user
router.put('/:id', (req, res) => {

  // if the user sent over any of the updatableFields, we update those values
  // in document
	const toUpdate = {};
	const updateableFields = ['firstName', 'lastName', 'userName', 'password'];

	updateableFields.forEach(field => {
		if (field in req.body) {
			toUpdate[field] = req.body[field];
		}
	});

	return User
    // all key/value pairs in toUpdate will be updated.
		.update(toUpdate, {
			where: {
				id: req.params.id
			}
		})
  .then(() => res.status(204).end())
  .catch(err => res.status(500).json({message: 'Internal server error'}));
});

// can delete a user by id
router.delete('/:id', (req, res) => {
	return User
		.destroy({
			where: {
				id: req.params.id
			}
		})
    .then(() => res.status(204).end())
    .catch(err => res.status(500).json({message: 'Internal server error'}));
});

module.exports = router;