const express = require('express');
const router = express.Router();

const {Trip, Memory} = require('../models');

// can get individual memories by id
router.get('/:id', (req, res) => Memory.findById(req.params.id)
	.then(memory => res.json(memory.apiRepr()))
);

// update a memory
router.put('/:id', (req, res) => {
  // if the user sent over any of the updatableFields, we update those values
  // in document
	const toUpdate = {};
	const updateableFields = ['imgUrl', 'comments', 'dateCreated'];

	// build object to be used for updates
	updateableFields.forEach(field => {
		if (field in req.body) {
			toUpdate[field] = req.body[field];
		}
	});

	return Memory
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
  return Memory
    .destroy({
      where: {
        id: req.params.id
      }
    })
    .then(() => res.status(204).end())
    .catch(err => res.status(500).json({message: 'Internal server error'}));
});

module.exports = router;