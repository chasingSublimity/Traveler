const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const moment = require('moment-timezone');
const app = require('../app');
const {Trip, Memory} = require('../models');

const should = chai.should();
const now = moment();

chai.use(chaiHttp);

function seedMemoryData(seedNum=10) {
	const trips = [];
	for (let i=1; i<=seedNum; i++) {
		trips.push(generateMemoryData());
	}
	return Promise.all(trips);
}

function generateLocation() {
	const origins = [
		'Lubbock', 'Fort Worth', 'Houston', 'Bronx', 'Staten Island'];
	return origins[Math.floor(Math.random() * origins.length)];
}

function generateMemoryData() {
	return Trip.create(
		{
			imgUrl: 'http://placekitten.com/200/300',
			location: generateLocation(),
			comments: `Lorem ipsum dolor sit amet, consectetur adipiscing elit, 
								sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`,
			dateCreated: now
		}
	);
}