'use strict';

const fs = require( '../lib/fs.js' );
const interval = require( '../lib/interval.js' );

module.exports = function( config, mqtt ) {

	if( typeof config != 'object' ) config = {};
	if( typeof config.interval != 'number' ) config.interval = 60000;

	fs.stat( '/proc/uptime' ).then( () => {
		console.log( "Start publishing uptime" );
		interval.create( "uptime", config.interval, pubUptime );
	} ).catch( () => {} );


	function pubUptime() {
		return fs.readFile( '/proc/uptime' ).then( ( uptime ) => {
			uptime = parseInt( uptime.toString().split( ' ' )[ 0 ] );
			mqtt.publish( uptime );
		} );
	}

}
