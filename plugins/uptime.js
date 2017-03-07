'use strict';

const fs = require( '../lib/fs.js' );
const interval = require( '../lib/interval.js' );

module.exports = function( config, mqtt ) {

	fs.stat( '/proc/uptime' ).then( () => {
		console.log( "Start publishing uptime" );
		interval.create( "uptime", 60000, pubUptime );
	} ).catch( () => {} );


	function pubUptime() {
		return fs.readFile( '/proc/uptime' ).then( ( uptime ) => {
			uptime = uptime.toString().split( ' ' )[ 0 ];
			mqtt.publish( uptime );
		} );
	}

}
