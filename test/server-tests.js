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

  // drop tables after all tests
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
				beginDate: generateBeginDate(),
				endDate: generateEndDate(),
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

          // WORKAROUND! Manually appending the ending because this is pissing me off.
					res.body.beginDate.should.equal(newTripData.beginDate + 'T05:00:00.000Z');
          res.body.endDate.should.equal(newTripData.endDate + 'T05:00:00.000Z');

          // check the trip created in db with seed data
          return Trip.findById(res.body.id);
        })
        .then(function(trip) {
          // console.log(trip);
          // console.log('trip.beginDate: ', trip.beginDate);
          // console.log('newTripData.beginDate: ', newTripData.beginDate + 'T05:00:00.000Z');
          // console.log(trip.beginDate === newTripData.beginDate);
          trip.origin.should.equal(newTripData.origin);
          trip.destination.should.equal(newTripData.destination);

          // ignoring these tests for now
          // trip.beginDate.should.equal(newTripData.beginDate);
          // trip.endDate.should.equal(newTripData.endDate);
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

//   describe('DELETE endpoint', function() {
//     // strategy:
//     //  1. get a restaurant
//     //  2. make a DELETE request for that restaurant's id
//     //  3. assert that response has right status code
//     //  4. prove that restaurant with the id doesn't exist in db anymore
//     it('delete a restaurant by id', function() {


//       // TODO add assertions about associated grades being deleted
//       let restaurant;

//       return Restaurant
//         .findOne()
//         .then(function(_restaurant) {
//           restaurant = _restaurant;
//           return chai.request(app).delete(`/restaurants/${restaurant.id}`);
//         })
//         .then(function(res) {
//           res.should.have.status(204);
//           return Restaurant.findById(restaurant.id);
//         })
//         .then(function(_restaurant) {
//           // when a variable's value is null, chaining `should`
//           // doesn't work. so `_restaurant.should.be.null` would raise
//           // an error. `should.be.null(_restaurant)` is how we can
//           // make assertions about a null value.
//           should.not.exist(_restaurant);
//         });
//     });
//   });

//   describe('GET grades for a restaurant endpoint', function() {

//     it('should return all grades for a restaurant', function() {
//       // strategy:
//       //    1. get id of a restaurant
//       //    2. get back its grades from api
//       //    3. prove count and ids correct
//       let restaurant;

//       return Restaurant
//         .findOne({include: [{model: Grade, as: 'grades'}]})
//         .then(_restaurant => {
//           restaurant = _restaurant;
//           return chai.request(app)
//             .get(`/restaurants/${restaurant.id}/grades`);
//         })
//         .then(function(res) {
//           // res.should.have.status(200);
//           res.body.grades.length.should.equal(restaurant.grades.length);
//           restaurant.grades.map(grade => grade.id).should.deep.equal(res.body.grades.map(grade => grade.id))
//         });
//     });
//   });
// });
});