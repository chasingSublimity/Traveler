const express = require('express');
const router = express.Router();

const {Trip, Memory} = require('../models');

// get trips
router.get('/', (req, res) => Trip.findAll(
  // The `include` part will cause each trip's memories,
  // if any, to be eager loaded. That means that the
  // related grade data is fetched from the db at the same
  // time as the trip data. We need both data sources
  // available for our `.apiRepr` method to work when we call
  // it on each trip below.
	{
		include: [{
			model: Memory,
			// since we're setting `tableName` in our model definition for `Memory`,
			// we need to use `as` here with the same table name, otherwise
			// Sequelize won't find it.
			as: 'memories'
		}]
	}).then(trips => res.json({
		trips: trips.map(trip => trip.apiRepr())
	}))
);

// can get individual trips by id
router.get('/:id', (req, res) => Trip.findById(req.params.id, {
	// see notes on `include` from route for `/`, above
	include: [{
		model: Memory,
	// since we're setting `tableName` in our model definition for `Memory`,
	// we need to use `as` here with the same table name
		as: 'memories'
	}]
}).then(trip => res.json(trip.apiRepr())));

// can create a new trip
router.post('/', (req, res) => {
  // ensure we have required fields
	const requiredFields = ['origin', 'destination', 'beginDate', 'endDate'];
	for (let i=0; i<requiredFields.length; i++) {
		const field = requiredFields[i];
		if (!(field in req.body)) {
			const message = `Missing \`${field}\` in request body`;
			console.error(message);
			return res.status(400).send(message);
		}
	}
  // `.create` creates a new instance and saves it to the db
  // in a single step.
  // http://docs.sequelizejs.com/en/latest/api/model/#createvalues-options-promiseinstance
	return Trip.create({
		origin: req.body.origin,
		destination: req.body.destination,
		beginDate: req.body.beginDate,
		endDate: req.body.endDate,
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


// can create a new Memory
router.post('/:id/memories', (req, res) => {
	return Memory.create({
		tripId: req.body.tripId,
		imgUrl: req.body.imgUrl,
		location: req.body.location,
		comments: req.body.comments,
		dateCreated: req.body.dateCreated,
	})
  .then(memory => res.status(201).json(memory.apiRepr()))
  .catch(err => res.status(500).send({message: err.message}));
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