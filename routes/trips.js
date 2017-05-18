const express = require('express');
const router = express.Router();

const {Trip, Memory, User} = require('../models');

// get trips by grabbing the id from the user and then finding trips belonging to that id
router.get('/', (req, res) => {
	User.find({
		where: {userName: req.query.userName}
	}).then(user => { Trip.findAll(
		{
			where: {
				userId: user.id
			},
			include: [{
				model: Memory,
				as: 'memories'
			}]
		})
	.then(trips => res.json({
		trips: trips.map(trip => trip.apiRepr())}));
	});
});

// can get individual trips by id
router.get('/:id', (req, res) => Trip.findById(req.params.id, {
	include: [{
		// necessary for eager loading
		model: Memory,
		// tells sequlize to explicitly look for table called 'memories'
		as: 'memories'
	}]
}).then(trip => {
	// send back json containing trip data and trip memories
	res.json({
		tripData:trip.apiRepr(),
		memories: trip.memories
	});
}));

// can create a new trip
router.post('/', (req, res) => {
	// grab userName from req body
	const {userName} = req.body;

	// find user, grab userId, create trip with userId
	User
	.findOne({
		where: {
			'userName': userName
		}
	}).then(user => {
		return Trip.create({
			origin: req.body.origin,
			destination: req.body.destination,
			beginDate: req.body.beginDate,
			endDate: req.body.endDate,
			userId: user.id
		});
	})
	.then(trip => res.status(201).json(trip.apiRepr()))
  .catch(err => res.status(500).send({message: err.message}));
});

// update a trip
router.put('/:id', (req, res) => {

  // if the user sent over any of the updatableFields, we update those values
  // in document
	const toUpdate = {};
	const updateableFields = ['origin', 'destination', 'beginDate', 'beginDate', 'endDate'];

	updateableFields.forEach(field => {
		if (field in req.body) {
			toUpdate[field] = req.body[field];
		}
	});

	return Trip
    // all key/value pairs in toUpdate will be updated.
		.update(toUpdate, {
			where: {
				id: req.params.id
			}
		})
  .then(() => res.status(204).end())
  .catch(err => res.status(500).json({message: 'Internal server error'}));
});

// can delete a restaurant by id
router.delete('/:id', (req, res) => {
	return Trip
		.destroy({
			where: {
				id: req.params.id
			}
		})
    .then(() => res.status(204).end())
    .catch(err => res.status(500).json({message: 'Internal server error'}));
});

// can retrieve all the memories, if any, for a trip
router.get('/:id/memories', (req, res) => {
	return Trip
		.findById(req.params.id, {
			include: [{
				model: Memory,
				as: 'memories'
			}]
		})
		.then(trip => res.json({
			memories: trip.memories.map(memory => memory.apiRepr())
		}));
});

module.exports = router;