const env = process.env.NODE_ENV || 'development';

// default to dev database
const DATABASE_URL = (
  process.env.DATABASE_URL ||
  global.DATABASE_URL ||
  'postgres://frgfkdpa:sDUl3nli-i0qUmHjn9k03QKeltVyZpDa@stampy.db.elephantsql.com:5432/frgfkdpa'
);

const TEST_DATABASE_URL = (
  process.env.TEST_DATABASE_URL ||
  global.TEST_DATABASE_URL ||
  'postgres://localhost/test-traveler-app'
);

module.exports = {
	PORT: process.env.PORT || 8080,
	// if we're in test environment, we use the test database url,
	// otherwise DATABASE_URl, which defaults to dev
	DATABASE_URL: env === 'test' ? TEST_DATABASE_URL : DATABASE_URL,
	// see http://docs.sequelizejs.com/en/latest/api/sequelize/#new-sequelizedatabase-usernamenull-passwordnull-options
	SEQUELIZE_OPTIONS: {logging: env === 'test' ? false : console.log}
};