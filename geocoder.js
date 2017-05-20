const NodeGeocoder = require('node-geocoder');

const options = {
	provider: 'google',
	httpAdapter: 'https',
	apiKey: process.env.GEO_API_KEY,
	formatter: null
};

const geocoder = NodeGeocoder(options);

// use geocoder library to convert location string into stringified coordinates
function geocodeLocationData(locationString) {
	return geocoder.geocode(locationString)
		.then(res => {
			const geoData = res[0];
			const locationCoordinates = [geoData.latitude, geoData.longitude];
			return JSON.stringify(locationCoordinates);
		})
		.catch(err => {
			console.log(err);
		});
}


module.exports = geocodeLocationData;