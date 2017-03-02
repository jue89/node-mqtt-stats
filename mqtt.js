'use strict';

const MQTT = require( 'mqtt' );
const config = require( './config.js' );


// Connect to broker
const mqtt = MQTT.connect( config.global.broker, config.global.options );
mqtt.on( 'error', ( e ) => {
	console.error( `MQTT Error: ${e.stack}` );
} );


// Helper function for concatting topic paths
function concatPath( elements ) {

	let path = [];
	for( let e of elements ) {
		for( let i of e.split( '/' ) ) {
			if( i !== '' ) path.push( i );
		}
	}

	return path.join( '/' );

}


class MqttPublisher {

	constructor( prefix ) {
		this._prefix = prefix;
	}

	publish( endpoint, timestamp, value ) {

		// Check paramters
		if( endpoint === undefined ) throw new Error( "Parameters missing" );
		if( timestamp === undefined ) {
			// Just value has been stated
			value = endpoint;
			endpoint = '';
			timestamp = new Date();
		} else if( value === undefined ) {
			value = timestamp;
			if( typeof endpoint === 'string' ) {
				// Endpoint and value have been stated
				timestamp = new Date();
			} else if( endpoint instanceof Date ) {
				// Timestamp and value have been stated
				timestamp = endpoint;
				endpoint = '';
			} else {
				throw new Error( "Endpoint / timestamp are wrong datatypes" )
			}
		} else {
			if( typeof endpoint !== 'string' ) throw new Error( "Endpoint must be a string" );
			if( ! ( timestamp instanceof Date ) ) throw new Error( "Timestamp must be a Date" );
		}

		// Process data
		endpoint = concatPath( [ config.global.prefix, this._prefix, endpoint ] );
		timestamp = timestamp.getTime().toString();
		value = value.toString();

		// Publish \o/
		mqtt.publish( endpoint, `${timestamp},${value}`, { qos: 1 } );

	}

}

module.exports = MqttPublisher;
