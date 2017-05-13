const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const moment = require('moment-timezone');
const app = require('../app');
const {User, Trip} = require('../models');

const should = chai.should();
const now = moment();

chai.use(chaiHttp);

function seedUserData(seedNum=10) {
	const users = [];
	for (let i=1; i<=seedNum; i++) {
		users.push(generateUserData());
	}
	return Promise.all(users);
}

function generateUserData() {
	return User.create(
		{
			firstName: faker.name.firstName(),
			lastName: faker.name.lastName(),
			userName: faker.internet.userName(),
			password: faker.internet.password(),
			createdAt: now,
			updatedAt: now
		}, {
			include: [{
				model: Trip,
				as: 'trips'
			}]
		});
}

describe('User API', function() {

  // to make tests quicker, only drop all rows from each
  // table in between tests, instead of recreating tables
  beforeEach(function() {
		console.log('dropping rows...');
		return User
			// .truncate drops all rows in this table
			.truncate({cascade: true})
			// then seed db with new test data
			.then(() => {
				console.log('seeding rows...');
				return seedUserData();
			});
	});

  // Only used for debugging.
  // drop rows after all tests.
  // after(function() {
		// console.log('dropping rows...');
		// return User
		// 	.truncate({cascade:true});
  // });

  describe('POST endpoint', function() {
    // strategy: make a POST request with data,
    // then prove that the user we get back has
    // right keys, and that `id` is there (which means
    // the data was inserted into db)
    it('should add a new user', function() {

      const newUserData = {
				firstName: faker.name.firstName(),
				lastName: faker.name.lastName(),
				userName: faker.internet.userName(),
        password: faker.internet.password()
      };

      return chai.request(app).post('/users').send(newUserData)
        .then(function(res) {

          res.should.have.status(201);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.include.keys(
            'id', 'firstName', 'lastName', 'userName');
          // db should have created id on insertion
          res.body.id.should.not.be.null;
          // verify the response sent by db equals the user data we made
          res.body.firstName.should.equal(newUserData.firstName);
          res.body.lastName.should.equal(newUserData.lastName);
          res.body.userName.should.equal(newUserData.userName);
          res.body.should.not.include.key('password');

          // check the user created in db with seed data
          return User.findById(res.body.id);
        })
        .then(function(user) {
          user.firstName.should.equal(newUserData.firstName);
          user.lastName.should.equal(newUserData.lastName);
          user.userName.should.equal(newUserData.userName);

          // check hashing function
          user.password.should.not.equal(newUserData.password);
          const didPasswordHashCorrectly = user.validatePassword(newUserData.password);
          didPasswordHashCorrectly.should.equal(true);
        });
    });
  });

  describe('PUT endpoint', function() {
    // strategy:
    //  1. Get an existing user from db
    //  2. Make a PUT request to update that user
    //  3. Prove user returned by request contains data we sent
    //  4. Prove user in db is correctly updated
    it('should update fields you send over', function() {
      const updateData = {
        firstName: 'Blake',
        lastName: 'Sager',
        userName: 'chasingSublimity',
        password: 'badasspassword'
      };

      return User
        .findOne()
        .then(function(user) {
          updateData.id = user.id;
          // make request then inspect it to make sure it reflects
          // data we sent
          return chai.request(app)
            .put(`/users/${user.id}`)
            .send(updateData);
        }).then(function(res) {
          res.should.have.status(204);
          return User.findById(updateData.id);
        }).then(function(user) {
          user.firstName.should.equal(updateData.firstName);
          user.lastName.should.equal(updateData.lastName);
          user.userName.should.equal(updateData.userName);
          user.password.should.equal(updateData.password);
        });
      });
  });

  describe('DELETE endpoint', function() {
    // strategy:
    //  1. get a user
    //  2. make a DELETE request for that user's id
    //  3. assert that response has right status code
    //  4. prove that user with the id doesn't exist in db anymore
    it('delete a user by id', function() {

			let user;

      return User
        .findOne()
        .then(function(_user) {
          user = _user;
          return chai.request(app).delete(`/users/${user.id}`);
        })
        .then(function(res) {
          res.should.have.status(204);
          return User.findById(user.id);
        })
        .then(function(_user) {
          should.not.exist(_user);
        });
    });
  });
});

module.exports = seedUserData;