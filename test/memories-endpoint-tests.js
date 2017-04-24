const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const moment = require('moment-timezone');
const app = require('../app');
const {Trip, Memory} = require('../models');
const seedTripData = require('./trips-endpoint-tests');
const should = chai.should();
const now = moment();

chai.use(chaiHttp);

function seedMemoryData(seedNum=1, tripId) {
	const memories = [];
	for (let i=1; i<=seedNum; i++) {
		memories.push(generateMemoryData());
	}
	return Promise.all(memories);
}

function generateLocation() {
	const origins = [
		'Lubbock', 'Fort Worth', 'Houston', 'Bronx', 'Staten Island'];
	return origins[Math.floor(Math.random() * origins.length)];
}

function generateMemoryData(tripId) {
	return Memory.create(
		{
			imgUrl: 'http://placekitten.com/200/300',
			location: generateLocation(),
			comments: `Lorem ipsum dolor sit amet, consectetur adipiscing elit, 
								sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`,
			dateCreated: now,
			tripId: 5
		}
	);
}

describe('Memory API', function() {


	// before the test cycle, seed the test db with a trip so that the relations 
	// can be tested.
	before(function() {
		console.log('seeding trip data...');
		// imported from trips endpoint tests
		seedTripData(1);
	});

	// to make tests quicker, only drop all rows from each
  // table in between tests, instead of recreating tables
	beforeEach(function() {
		console.log('getting trip id');


		console.log('dropping rows...');
		return Memory
			// drop rows
			.truncate()
			// seed db
			.then(() => {
				console.log('seeding rows...');
				return seedMemoryData(tripId);
			});
	});

	// drop rows after all tests. only used for debugging.
	// after(function() {
	// 	console.log('tests finished, dropping rows...');
	// 	return Memory
	// 		.truncate();
	// });

	describe('Get endpoint', function() {

		it('should return all memories for one trip', function() {
			// strategy:
			//    1. make get request to /trips to get trip id
			//    2. get back all memories for that trip via by GET request to `/trips/:id/memories`
			//    2. prove res has right status, data type
			//    3. prove the number of memories we got back is equal to number
			//       in db.


			let tripId;

			return Trip
				.findOne()
				.then(trip => {
					// make response object available to other .then blocks 
					tripId = trip.id;
					return Memory.count();
				})
				.then(function(count) {
					res.body.memories.should.have.lenght.of(count);
				});
		});

	});

});






