const NodeGeocoder = require('node-geocoder');

const options = {
	provider: 'google',
	httpAdapter: 'https', // Default
	apiKey: process.env.GEO_API_KEY,
	formatter: null         // 'gpx', 'string', ...
};

const geocoder = NodeGeocoder(options);

// use geocoder library to convert location string into data
function geocodeLocationData(locationString) {
	return geocoder.geocode(locationString)
		.then(res => {
			const geoData = res[0];
			const locationCoordinates = [geoData.latitude, geoData.longitude];
			// console.log(locationCoordinates);
			return locationCoordinates;
		})
		.catch(err => {
			console.log(err);
		});
}


module.exports = geocodeLocationData;