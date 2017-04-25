const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const moment = require('moment-timezone');
const app = require('../app');
const {Trip, Memory} = require('../models');

const should = chai.should();
const now = moment();

chai.use(chaiHttp);

function seedTripData(seedNum=10) {
	const trips = [];
	for (let i=1; i<=seedNum; i++) {
		trips.push(generateTripData());
	}
	return Promise.all(trips);
}

function generateOriginName() {
	const origins = [
		'Lubbock', 'Fort Worth', 'Houston', 'Bronx', 'Staten Island'];
	return origins[Math.floor(Math.random() * origins.length)];
}

function generateDestinationName() {
	const destinations = [
		'Dallas', 'San Francisco', 'Denver', 'Kenosha', 'Portland'];
	return destinations[Math.floor(Math.random() * destinations.length)];
}

// create date objects, dont use strings
function generateBeginDate() {
	const dates = ['2017-04-28', '2017-05-15','2017-06-08', '2017-07-30'];
	return dates[Math.floor(Math.random() * dates.length)];
}

function generateEndDate() {
  // ask about effing witchcraft on that last date.
	const dates = ['2017-08-28', '2017-09-15', '2017-10-08', '2017-11-05'];
	return dates[Math.floor(Math.random() * dates.length)];
}

function generateTripData() {
	return Trip.create(
		{
			origin: generateOriginName(),
			destination: generateDestinationName(),
			beginDate: generateBeginDate(),
			endDate: generateEndDate(),
			createdAt: now,
			updatedAt: now
		}, {
			include: [{
				model: Memory,
				as: 'memories'
			}]
		});
}

describe('Trip API', function() {

  // to make tests quicker, only drop all rows from each
  // table in between tests, instead of recreating tables
  beforeEach(function() {
		console.log('dropping rows...');
		return Trip
			// .truncate drops all rows in this table
			.truncate({cascade: true})
			// then seed db with new test data
			.then(() => {
				console.log('seeding rows...');
				return seedTripData();
			});
	});

  // drop rows after all tests
  after(function() {
		console.log('dropping rows...');
		return Trip
			.truncate({cascade:true});
  });

	describe('GET endpoint', function() {

		it('should return all existing trips', function() {
      // strategy:
      //    1. get back all trip returned by by GET request to `/trips`
      //    2. prove res has right status, data type
      //    3. prove the number of trips we got back is equal to number
      //       in db.
      //
      // need to have access to mutate and access `res` across
      // `.then()` calls below, so declare it here so can modify in place
			let res;

			return chai.request(app)
        .get('/trips')
        .then(function(_res) {
          // so subsequent .then blocks can access resp obj.
				res = _res;
				res.should.have.status(200);
				// otherwise our db seeding didn't work
				res.body.trips.should.have.length.of.at.least(1);
				return Trip.count();
				})
        .then(function(count) {
					res.body.trips.should.have.length.of(count);
        });
		});

		it('should return a single trip by id', function() {
      // strategy:
      //    1. Get a trip from db
      //    2. Prove you can retrieve it by id at `/trips/:id`
			let trip;
			return Trip
        .findOne()
        .then(_trip => {
          trip = _trip;
          return chai.request(app)
            .get(`/trips/${trip.id}`);
				})
        .then(res => {
          res.should.have.status(200);
          res.body.id.should.equal(trip.id);
        });
    });

    it('should return a trip with right fields and info', function() {
      // Strategy: Get back all trips, and ensure they have expected keys

      return chai.request(app)
        .get('/trips')
        .then(function(res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.trips.should.be.a('array');
          res.body.trips.should.have.length.of.at.least(1);

          res.body.trips.forEach(function(trip) {
            trip.should.be.a('object');
            trip.should.include.keys(
              'id', 'origin', 'destination', 'beginDate', 'endDate');
        });
      });
    });
  });

  describe('POST endpoint', function() {
    // strategy: make a POST request with data,
    // then prove that the trip we get back has
    // right keys, and that `id` is there (which means
    // the data was inserted into db)
    it('should add a new trip', function() {

      const newTripData = { 
        origin: generateOriginName(),
        destination: generateDestinationName(),
				beginDate: moment().set({'year': 2013, 'month': 3, 'day': 10, 'hour':0, 'minute':0, 'second':0, 'millisecond': 0}),
				endDate: moment().set({'year': 2013, 'month': 3, 'day': 15, 'hour':0, 'minute':0, 'second':0, 'millisecond': 0}),
        createdAt: now,
        updatedAt: now
      };

      return chai.request(app).post('/trips').send(newTripData)
        .then(function(res) {

          res.should.have.status(201);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.include.keys(
            'id', 'origin', 'destination', 'beginDate', 'endDate');
          res.body.origin.should.equal(newTripData.origin);
          // db should have created id on insertion
          res.body.id.should.not.be.null;
          // verify the response sent by db equals the trip data we made
          res.body.destination.should.equal(newTripData.destination);
          // moment.utc is used to homogenize the format of the dates.
					moment.utc(res.body.beginDate).format().should.equal(moment.utc(newTripData.beginDate).format());
          moment.utc(res.body.endDate).format().should.equal(moment.utc(newTripData.endDate).format());

          // check the trip created in db with seed data
          return Trip.findById(res.body.id);
        })
        .then(function(trip) {
          // console.log(trip);
          console.log('trip.beginDate: ', moment.utc(trip.beginDate).format());
          console.log('newTripData.beginDate: ', moment.utc(newTripData.beginDate).format());
          // console.log(typeof trip.beginDate);
          // console.log(typeof newTripData.beginDate);
          trip.origin.should.equal(newTripData.origin);
          trip.destination.should.equal(newTripData.destination);

          moment(trip.beginDate).format().should.equal(moment(newTripData.beginDate).format());
          moment(trip.endDate).format().should.equal(moment(newTripData.endDate).format());
        });
    });
  });

  describe('PUT endpoint', function() {

    // strategy:
    //  1. Get an existing trip from db
    //  2. Make a PUT request to update that trip
    //  3. Prove trip returned by request contains data we sent
    //  4. Prove trip in db is correctly updated
    it('should update fields you send over', function() {
      const updateData = {
        origin: 'Las Vegas',
        destination: 'Atlantis',
        beginDate: '2017-07-28',
        endDate: '2017-08-28'
      };

      return Trip
        .findOne()
        .then(function(trip) {
          updateData.id = trip.id;
          // make request then inspect it to make sure it reflects
          // data we sent
          return chai.request(app)
            .put(`/trips/${trip.id}`)
            .send(updateData);
        })
        .then(function(res) {
          res.should.have.status(204);
          return Trip.findById(updateData.id);
        })
        .then(function(trip) {
          trip.origin.should.equal(updateData.origin);
          trip.destination.should.equal(updateData.destination);
          // trip.beginDate.should.equal(updateData.beginDate);
          // trip.endDate.should.equal(updateData.endDate);
        });
      });
  });

  describe('DELETE endpoint', function() {
    // strategy:
    //  1. get a trip
    //  2. make a DELETE request for that trip's id
    //  3. assert that response has right status code
    //  4. prove that trip with the id doesn't exist in db anymore
    it('delete a trip by id', function() {

      let trip;

      return Trip
        .findOne()
        .then(function(_trip) {
          trip = _trip;
          return chai.request(app).delete(`/trips/${trip.id}`);
        })
        .then(function(res) {
          res.should.have.status(204);
          return Trip.findById(trip.id);
        })
        .then(function(_trip) {
          should.not.exist(_trip);
        });
    });
  });

  describe('GET memories for a trip endpoint', function() {

    // TODO: SEED MEMORIES
    it('should return all memories for a trip', function() {
      // strategy:
      //    1. get id of a trip
      //    2. get back its memories from api
      //    3. prove count and ids correct
      let trip;

      return Trip
        .findOne({include: [{model: Memory, as: 'memories'}]})
        .then(_trip => {
          trip = _trip;
          return chai.request(app)
            .get(`/trips/${trip.id}/memories`);
        })
        .then(function(res) {
          res.should.have.status(200);
          res.body.memories.length.should.equal(trip.memories.length);
          trip.memories.map(memory => memory.id).should.deep.equal(res.body.memories.map(memory => memory.id))
        });
    });
  });
});

module.exports = seedTripData();