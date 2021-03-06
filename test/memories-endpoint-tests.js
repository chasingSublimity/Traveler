const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const moment = require('moment-timezone');
const app = require('../app');
const {Trip, Memory, User} = require('../models');
const seedTripData = require('./trips-endpoint-tests');
const seedUserData = require('./users-endpoint-tests');
const should = chai.should();
const now = moment();

chai.use(chaiHttp);

// used for seed data
function generateLocation() {
	const origins = [
		'[32.7554883, -97.3307658]', '[29.7604267, -95.3698028]', 
		'[42.62890489999999, -78.7376522]', '[40.5795317, -74.1502007]'];
	return origins[Math.floor(Math.random() * origins.length)];
}

// trip Id is passed in from seedMemoryData
function generateMemoryData(tripId) {
	return Memory.create(
		{
			imgUrl: 'http://placekitten.com/200/300',
			location: generateLocation(),
			comments: `Lorem ipsum dolor sit amet, consectetur adipiscing elit, 
								sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`,
			date: now,
			tripId: tripId
		}
	);
}

// tripId is passed in the before() function below
function seedMemoryData(seedNum=1, tripId) {
	const memories = [];
	for (let i=1; i<=seedNum; i++) {
		memories.push(generateMemoryData(tripId));
	}
	return Promise.all(memories)
		.catch(error => {
			console.log('seedMemory error: ', error);
		});
}

describe('Memory API', function() {



	// these needs to be accessed by different scopes, so we define it
	// in the parent scope of the memory-endpoint tests
	let userId;
	let tripId;

	// before the test cycle, seed the test db with a user so that the relations
	// can be tested
	before(function() {
		console.log('seeding user data...');
		// seedUserData is imported from users-endpoint
		seedUserData(1);

		// grab a user_id from the DB and assign it to the userId in the
		// parent scope
		return User
			.findOne()
			.then(user => {
				userId = user.id;
			});
	});

	// before the test cycle, seed the test db with a trip so that the relations 
	// can be tested.
	before(function() {
		console.log('seeding trip data...');
		// seedTripData is imported from trips-endpoint tests
		// the first argument is the amount of trips, the second is
		// a userId
		seedTripData(1, userId);
		// grab a trip_id from the DB and assign it to the tripId in the 
		// parent scope
		return Trip
			.findOne()
			.then(trip => {
				tripId = trip.id;
			});
	});

	// to make tests quicker, only drop all rows from each
  // table in between tests, instead of recreating tables
	beforeEach(function() {
		console.log('dropping rows...');
		return Memory
			// drop rows in memory tables
			.truncate()
			// seed db
			.then(() => {
				console.log('seeding rows...');
				return seedMemoryData(1, tripId);
			});
	});

	// only used for debugging
	// drop rows after all tests.
	// after(function() {
	// 	console.log('tests finished, dropping rows...');
	// 	return Memory
	// 		.truncate();
	// });

	describe('Get endpoint', function() {

		it('should return single memory', function() {
			// defined in parent scope so other tests can access it
			let memory;
			// Strategy:
			// 1. Get a memory from DB
			// 2. Prove you can retrieve it by id at `/memories/id`
			return Memory
			.findOne()
				.then(_memory => {
					memory = _memory;
					return chai.request(app)
						.get(`/memories/${memory.id}`);
				}).then(res => {
					res.should.have.status(200);
					res.body.id.should.equal(memory.id);
				});
		});

		it('should return a memory with right fields and info', function() {
			// Strategy: Get back a memory, and ensure it has the expected keys
			let memory;
			return Memory
			.findOne()
				.then(_memory => {
					memory = _memory;
					return chai.request(app)
						.get(`/memories/${memory.id}`);
				})
				.then(function(res) {
					res.should.have.status(200);
					res.should.be.json;
					res.body.should.be.a('object');
					res.body.should.include.keys(
							'id', 'imgUrl', 'location', 'comments', 'date');
				});
		});
	});

	describe('POST endpoint', function() {

		// test for failing cases


		it('should add a new memory', function() {
		// Strategy: make a POST request with data
		// the prove that the response data matches the seed data and
		// that the 'id' is present, which means that the data was inserted 
		// into the db.
		// Next, we query the db and ensure that the data in the db matches the seed data.
			const newMemoryData = {
				imgUrl: 'http://placekitten.com/200/300',
				location: 'Lubbock, TX',
				comments: `Lorem ipsum dolor sit amet, consectetur adipiscing elit, 
									sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`,
				date: moment().set({'year': 2013, 'month': 3, 'day': 10, 'hour':0, 'minute':0, 'second':0, 'millisecond': 0}),
				tripId: tripId
			};
			return chai.request(app).post('/memories').send(newMemoryData)
				.then(res => {
					res.should.have.status(201);
					res.should.be.json;
					res.body.should.be.a('object');
					res.body.should.include.keys(
						'id', 'imgUrl', 'location', 'comments', 'date', 'tripId'
						);
					res.body.imgUrl.should.equal(newMemoryData.imgUrl);
					// hardcoding here because I don't want to deal with promises in my tests.
					res.body.location.should.equal('[33.5778631,-101.8551665]');
					res.body.comments.should.equal(newMemoryData.comments);
					moment.utc(res.body.date).format().should.equal(moment.utc(newMemoryData.date).format());
					res.body.tripId.should.equal(newMemoryData.tripId);
					res.body.id.should.not.be.null;

					// check memory in db with seed data
					return Memory.findById(res.body.id);
				})
				.then(memory => {
					memory.imgUrl.should.equal(newMemoryData.imgUrl);
					// hardcoding here because I don't want to deal with promises in my tests.
					memory.location.should.equal('[33.5778631,-101.8551665]');
					memory.comments.should.equal(newMemoryData.comments);
					moment(memory.date).format().should.equal(moment(newMemoryData.date).format());
					memory.tripId.should.equal(newMemoryData.tripId);
				});
		});
	});

	describe('PUT endpoint', function() {
		// strategy:
		//  1. Get an existing memory from db
		//  2. Make a PUT request to update that memory
		//  3. Prove memory returned by request contains data we sent
		//  4. Prove memory in db is correctly updated
		it('should update fields you send over', function() {
			const updateData = {
				imgUrl: 'http://placekitten.com/200/',
				location: 'disneyland',
				comments: 'HEY LOOK A NEW COMMENT',
				date: moment().set({'year': 2010, 'month': 3, 'day': 10, 'hour':0, 'minute':0, 'second':0, 'millisecond': 0}),
			};

			return Memory
				.findOne()
				.then(memory => {
					updateData.id = memory.id;
					return chai.request(app)
						.put(`/memories/${memory.id}`)
						.send(updateData);
				}).then(res => {
					res.should.have.status(204);
					return Memory.findById(updateData.id);
				}).then(memory => {
					memory.imgUrl.should.equal(updateData.imgUrl);
					memory.location.should.equal(updateData.location);
					memory.comments.should.equal(updateData.comments);
					// moment is used here to homogenize date formats
					moment.utc(memory.date).format().should.equal(moment.utc(updateData.date).format());
				});
		});
	});

	describe('DELETE endpoint', function() {
		// strategy:
		//  1. get a memory
		//  2. make a DELETE request for that memory's id
		//  3. assert that response has right status code
		//  4. prove that memory with the id doesn't exist in db anymore

		it('delete a memory by id', function() {
			let memory;

			return Memory
				.findOne()
				.then(_memory => {
					memory = _memory;
					return chai.request(app).delete(`/memories/${memory.id}`);
				}).then(res => {
					res.should.have.status(204);
					return Trip.findById(memory.id);
				}).then(_memroy => {
					should.not.exist(_memroy);
				});
		});
	});
});


