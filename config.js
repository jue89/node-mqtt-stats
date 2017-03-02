'use strict';

const fs = require( 'fs' );

module.exports = {
	"global": {
		"prefix": "org/example",
		"broker": "mqtts://broker.example.com",
		"options": {
			"key": fs.readFileSync( './client.key' ),
			"cert": fs.readFileSync( './client.crt' ),
			"ca": fs.readFileSync( './ca.crt' )
		}
	},
	"ping": [
		"8.8.8.8",
		"8.8.4.4"
	]
};
