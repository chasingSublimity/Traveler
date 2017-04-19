'use strict';

// we need the Sequelize library in order to
// get the different data types for model properties
// (for instance, `Sequelize.string`).
const Sequelize = require('sequelize');
// we should only have one sequelize instance in our
// whole app, which we can import here and other model
// files.
const {sequelize} = require('../db/sequelize');


const Memory = sequelize.define('Memory', 
	{
		imgUrl: {
			type: Sequelize.STRING,
			allowNull: false,
			field: 'img_url'
		},
		location: {
			type: Sequelize.TEXT,
			allowNull: false
		},
		comments: {
			type: Sequelize.TEXT,
			allowNull: true
		},
		dateCreated: {
			type: Sequelize.DATE,
			// in our JS code, we'll refer to this property
			// as `inspectionDate`, but in the db, the column
			// name will be `inspection_date`.
			field: 'date_created',
			allowNull: false
		},
	}, {
		// we explicitly tell Sequelize that this model is linked
		// to a table named 'grades' instead of having Sequelize
		// automatically determine table names, which can be error
		// prone
		tableName: 'memories',

		// this options ensures that if sequelize creates any
		// tables on behalf of this model (which in this app only
		// happens when we call `sequelize.sync` in our tests), camelCased
		// column names will be converted to snake_case for the database.
		underscored: true,
		classMethods: {
			// relations between models are declared in `.classMethods.associate`.
			associate: function(models) {
				Memory.belongsTo(
					models.Trip,
					// this is how we make memory.trip_id non-nullable
					// and ensure that when a trip is deleted, so to
					// are its memories. note that this correlates to the
					// relationships we've established in
					// the migration file
					{foreignKey: { allowNull: false }, onDelete: 'CASCADE' }
				);
			}
		},
		instanceMethods: {
	// we'll use this instance method to create a standard
	// standard representation of this resource in our app.
			apiRepr: function() {
				return {
					id: this.id,
					imgUrl: this.grade,
					location: this.location,
					comments: this.comments,
					dateCreated: this.dateCreated
				};
			}
		}
	}
);

// Although we export `Grade` here, any code that needs `Grade`
// should import it from `./models/index.js` (so, for instance,
// `const {Grade} = require('./models')`).
module.exports = {
	Memory
};
