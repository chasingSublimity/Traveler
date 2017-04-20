const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const app = require('../app')
const {Trip, Grade} = require('../models');

const should = chai.should();

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

// create a new restaurant with three grades
function generateTripData() {
  const date = faker.date.recent();
  return Trip.create({
    origin: generateOriginName(),
    destination: generateDestinationName(),
    beginDate: faker.date.recent(),
    endDate: faker.date.future(),
    createdAt: date,
    updatedAt: date,
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
    return Trip
      // .truncate drops all rows in this table
      .truncate({cascade: true})
      // then seed db with new test data
      .then(() => seedTripData());
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
      return trip
        .findOne()
        .then(_trip => {
          trip = _trip
          return chai.request(app)
            .get(`/trips/${trip.id}`);
        })
        .then(res => {
          res.should.have.status(200);
          res.body.id.should.equal(trip.id);
        })
    });

    it('should return trips with right fields', function() {
      // Strategy: Get back all trips, and ensure they have expected keys

      let resTrip;
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
          resTrip = res.body.trips[0];
          return Trip.findById(resTrip.id, {include: [{model: Memory, as: 'memories'}]});
        })
        .then(function(trip) {
          resTrip.id.should.equal(trip.id);
          resTrip.origin.should.equal(trip.origin);
          resTrip.destination.should.equal(trip.destination);
          resTrip.beginDate.should.equal(trip.beginDate);
          resTrip.endDate.should.equal(trip.endDate);
      });
    });
  });

//   describe('POST endpoint', function() {
//     // strategy: make a POST request with data,
//     // then prove that the restaurant we get back has
//     // right keys, and that `id` is there (which means
//     // the data was inserted into db)
//     it('should add a new restaurant', function() {

//       const newRestaurantData = {
//         name: faker.company.companyName(),
//         cuisine: generateCuisineType(),
//         borough: generateBoroughName(),
//         addressBuildingNumber: faker.address.streetAddress(),
//         addressStreet: faker.address.streetName(),
//         addressZipcode: faker.address.zipCode()
//       };
//       return chai.request(app).post('/restaurants').send(newRestaurantData)
//         .then(function(res) {
//           res.should.have.status(201);
//           res.should.be.json;
//           res.body.should.be.a('object');
//           res.body.should.include.keys(
//             'id', 'name', 'cuisine', 'borough', 'mostRecentGrade', 'address');
//           res.body.name.should.equal(newRestaurantData.name);
//           // cause db should have created id on insertion
//           res.body.id.should.not.be.null;
//           res.body.cuisine.should.equal(newRestaurantData.cuisine);
//           res.body.borough.should.equal(newRestaurantData.borough);

//           should.not.exist(res.body.mostRecentGrade);

//           return Restaurant.findById(res.body.id);
//         })
//         .then(function(restaurant) {
//           restaurant.name.should.equal(newRestaurantData.name);
//           restaurant.cuisine.should.equal(newRestaurantData.cuisine);
//           restaurant.borough.should.equal(newRestaurantData.borough);
//           restaurant.addressBuildingNumber.should.equal(newRestaurantData.addressBuildingNumber);
//           restaurant.addressStreet.should.equal(newRestaurantData.addressStreet);
//           restaurant.addressZipcode.should.equal(newRestaurantData.addressZipcode);
//         });
//     });
//   });

//   describe('PUT endpoint', function() {

//     // strategy:
//     //  1. Get an existing restaurant from db
//     //  2. Make a PUT request to update that restaurant
//     //  3. Prove restaurant returned by request contains data we sent
//     //  4. Prove restaurant in db is correctly updated
//     it('should update fields you send over', function() {
//       const updateData = {
//         name: 'fofofofofofofof',
//         cuisine: 'futuristic fusion'
//       };

//       return Restaurant
//         .findOne()
//         .then(function(restaurant) {
//           updateData.id = restaurant.id;
//           console.log()
//           // make request then inspect it to make sure it reflects
//           // data we sent
//           return chai.request(app)
//             .put(`/restaurants/${restaurant.id}`)
//             .send(updateData);
//         })
//         .then(function(res) {
//           res.should.have.status(204);
//           return Restaurant.findById(updateData.id);
//         })
//         .then(function(restaurant) {
//           restaurant.name.should.equal(updateData.name);
//           restaurant.cuisine.should.equal(updateData.cuisine);
//         });
//       });
//   });

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
