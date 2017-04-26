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

// used for seed data
function generateLocation() {
	const origins = [
		'Lubbock', 'Fort Worth', 'Houston', 'Bronx', 'Staten Island'];
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
			dateCreated: now,
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
			console.log('error: ', error);
		});
}

describe('Memory API', function() {

	// this needs to be accessed by different tests, so we define it
	// in the parent scope of the memory-endpoint tests
	let tripId;

	// before the test cycle, seed the test db with a trip so that the relations 
	// can be tested.
	before(function() {
		console.log('seeding trip data...');
		// seedTripData is imported from trips-endpoint tests
		seedTripData(1);
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
							'id', 'imgUrl', 'location', 'comments', 'dateCreated');
				});
		});
	});

	describe('POST endpoint', function() {

		it ('should add a new memory', function() {
		// Strategy: make a POST request with data
		// the prove that the response data matches the seed data and
		// that the 'id' is present, which means that the data was inserted 
		// into the db.
		// Next, we query the db and ensure that the data in the db matches the seed data.
			const newMemoryData = {
				imgUrl: 'http://placekitten.com/200/300',
				location: generateLocation(),
				comments: `Lorem ipsum dolor sit amet, consectetur adipiscing elit, 
									sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`,
				dateCreated: moment().set({'year': 2013, 'month': 3, 'day': 10, 'hour':0, 'minute':0, 'second':0, 'millisecond': 0}),
				tripId: tripId
			};
			return chai.request(app).post('/memories').send(newMemoryData)
				.then(res => {
					res.should.have.status(201);
					res.should.be.json;
					res.body.should.be.a('object');
					res.body.should.include.keys(
						'id', 'imgUrl', 'location', 'comments', 'dateCreated', 'tripId'
						);
					res.body.imgUrl.should.equal(newMemoryData.imgUrl);
					res.body.location.should.equal(newMemoryData.location);
					res.body.comments.should.equal(newMemoryData.comments);
					moment.utc(res.body.dateCreated).format().should.equal(moment.utc(newMemoryData.dateCreated).format());
					res.body.tripId.should.equal(newMemoryData.tripId);
					res.body.id.should.not.be.null;

					// check memory in db with seed data
					return Memory.findById(res.body.id);
				})
				.then(memory => {
					memory.imgUrl.should.equal(newMemoryData.imgUrl);
					memory.location.should.equal(newMemoryData.location);
					memory.comments.should.equal(newMemoryData.comments);
					moment(memory.dateCreated).format().should.equal(moment(newMemoryData.dateCreated).format());
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
				dateCreated: moment().set({'year': 2010, 'month': 3, 'day': 10, 'hour':0, 'minute':0, 'second':0, 'millisecond': 0}),
			};

			return Memory
				.findOne()
				.then(memory => {
					console.log('entered into first then block');
					updateData.id = memory.id;
					return chai.request(app)
						.put(`/memories/${memory.id}`)
						.send(updateData);
				}).then(res => {
					console.log('entered into second then block');
					res.should.have.status(204);
					return Memory.findById(updateData.id);
				}).then(memory => {
					memory.imgUrl.should.equal(updateData.imgUrl);
					memory.location.should.equal(updateData.location);
					memory.comments.should.equal(updateData.comments);
					moment.utc(memory.dateCreated).format().should.equal(moment.utc(updateData.dateCreated).format());
				});
		});
	});

	describe('DELETE endpoint', function() {
		// strategy:
		//  1. get a memory
		//  2. make a DELETE request for that memory's id
		//  3. assert that response has right status code
		//  4. prove that memory with the id doesn't exist in db anymore

		it('delte a memory by id', function() {
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


