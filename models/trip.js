'use strict';

// we need the Sequelize library in order to
// get the different data types for model properties
// (for instance, `Sequelize.string`).
const Sequelize = require('sequelize');
// we should only have one sequelize instance in our
// whole app, which we can import here and other model
// files.
const {sequelize} = require('../db/sequelize');

const Trip = sequelize.define('Trip', 
	{
		origin: {
			type: Sequelize.TEXT,
			allowNull: false
		},
		destination: {
			type: Sequelize.TEXT,
			allowNull: false
		},
		beginDate: {
			type: Sequelize.DATE,
			field: 'begin_date',
			allowNull: false
		},
		endDate: {
			type: Sequelize.DATE,
			field: 'end_date',
			allowNull: false
		}
	}, {
    // we explicitly tell Sequelize that this model is linked
    // to a table named 'trips' instead of having Sequelize
    // automatically determine table names, which can be error
    // prone
		tableName: 'trips',
    // this options ensures that if sequelize creates any
    // tables on behalf of this model. Not currently necessary,
    // but leaving it in case of future changes
		underscored: true,
		getterMethods: {
      // none right now, but may use getters in the future
		},
		classMethods: {
      // relations between models are declared in `.classMethods.associate`, which gets called
      // in `/models/index.js`
			associate: function(models) {
				Trip.hasMany(
          models.Memory,
					{
						as: 'memories',
						// this is how we make memory.trip_id non-nullable
						foreignKey: { allowNull: false },
						// when a trip is deleted, that should cascade
						// to its memories. note that this correlates with the
						// relationships we've established in
						// the shell script
						onDelete: 'CASCADE'
					});
			}
		},
		instanceMethods: {
      // we'll use this instance method to create a standard
      // standard representation of this resource in our app.
			apiRepr: function() {
				return {
					id: this.id,
					origin: this.origin,
					destination: this.destination,
					beginDate: this.beginDate,
					endDate: this.endDate
				};
			}
		}
	}
);

// Although we export `Restaurant` here, any code that needs `Restaurant`
// should import it from `./models/index.js` (so, for instance,
// `const {Restaurant} = require('./models')`).
module.exports = {
	Trip
};
