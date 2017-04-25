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
			// this is really weird.
			trip_id: tripId
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

	// drop rows after all tests. only used for debugging.
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
						.get(`/memories/${memory.id}`)
				.then(function(res) {
					res.should.have.status(200);
					res.should.be.json;
					res.body.should.be.a('object');
					res.body.should.include.keys(
							'id', 'imgUrl', 'location', 'comments', 'dateCreated');
				});
			});
		});
	});
});

