'use strict';

// we need the Sequelize library in order to
// get the different data types for model properties
// (for instance, `Sequelize.string`).
const Sequelize = require('sequelize');
// we should only have one sequelize instance in our
// whole app, which we can import here and other model
// files.
const {sequelize} = require('../db/sequelize');

const User = sequelize.define('User', 
	{
		firstName: {
			type: Sequelize.TEXT,
			field: 'first_name'
		},
		lastName: {
			type: Sequelize.TEXT,
			allowNull: false,
			field: 'last_name'
		},
		userName: {
			type: Sequelize.TEXT,
			field: 'user_name',
			allowNull: false
		}
	}, {
    // we explicitly tell Sequelize that this model is linked
    // to a table named 'trips'
		tableName: 'users',
    // this options ensures that if sequelize creates any
    // tables on behalf of this model.
		underscored: true,
		getterMethods: {
      // none right now, but may use getters in the future
		},
		classMethods: {
      // relations between models are declared in `.classMethods.associate`, which gets called
      // in `/models/index.js`
			associate: function(models) {
				User.hasMany(
          models.Trip,
					{
						as: 'trips',
						foreignKey: {
							name: 'userId',
							field: 'user_id',
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
					firstName: this.firstName,
					lastName: this.lastName,
					userName: this.userName
				};
			}
		}
	}
);

// Although we export `Restaurant` here, any code that needs `Restaurant`
// should import it from `./models/index.js` (so, for instance,
// `const {Restaurant} = require('./models')`).
module.exports = {
	User
};
