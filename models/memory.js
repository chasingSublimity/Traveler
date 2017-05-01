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
			field: 'img_url',
			validate: {
				isURL: true
			}
		},
		location: {
			type: Sequelize.TEXT,
			allowNull: false
		},
		comments: {
			type: Sequelize.TEXT,
			allowNull: true
		},
		date: {
			type: Sequelize.DATE,
			allowNull: false,
			validate: {
				isDate: true
			}
		}
	}, {
		// we explicitly tell Sequelize that this model is linked
		// to a table named 'memories' instead of having Sequelize
		// automatically determine table names, which can be error
		// prone
		tableName: 'memories',
		underscored: true,

		classMethods: {
			// relations between models are declared in `.classMethods.associate`.
			associate: function(models) {
				Memory.belongsTo(models.Trip, {
					foreignKey: {
						name: 'tripId',
						field: 'trip_id',
						allowNull: false
					},
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
					imgUrl: this.imgUrl,
					location: this.location,
					comments: this.comments,
					date: this.date,
					tripId: this.tripId
				};
			}
		}
	}
);

// Although we export `Memory` here, any code that needs `Memory`
// should import it from `./models/index.js` (so, for instance,
// `const {Memory} = require('./models')`).
module.exports = {
	Memory
};
