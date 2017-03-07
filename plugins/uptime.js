'use strict';

const fs = require( 'fs' );
const interval = require( '../lib/interval.js' );

module.exports = function( config, mqtt ) {

	if( fs.existsSync( '/proc/uptime' ) ) {
		console.log( "Start publishing uptime" );
		interval.create( "uptime", 60000, pubUptime );
	}


	function pubUptime() {
		fs.readFile( '/proc/uptime', ( err, uptime ) => {
			if( err ) throw err;
			uptime = uptime.toString().split( ' ' )[ 0 ];
			mqtt.publish( uptime );
		} );
	}

}
