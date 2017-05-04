const express = require('express');
const router = express.Router();

const {User} = require('../models');

// can create a new user
router.post('/', (req, res) => {
  // `.create` creates a new instance and saves it to the db
  // in a single step.
  // http://docs.sequelizejs.com/en/latest/api/model/#createvalues-options-promiseinstance
	return User.create({
		firstName: req.body.firstName,
		lastName: req.body.lastName,
		userName: req.body.userName,
		password: req.body.password
	})
  .then(user => res.status(201).json(user.apiRepr()))
  .catch(err => res.status(500).send({message: err.message}));
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