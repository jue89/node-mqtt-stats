'use strict';

const fs = require( 'fs' );
const interval = require( '../lib/interval.js' );

module.exports = function( config, mqtt ) {

	if( fs.existsSync( '/proc/loadavg' ) ) {
		console.log( "Start publishing load" );
		interval.create( "load", 10000, pubLoad );
	}


	function pubLoad() {
		fs.readFile( '/proc/loadavg', ( err, load ) => {
			if( err ) throw err;
			load = load.toString().split( ' ' );
			mqtt.publish( 'avg1', load[0] );
			mqtt.publish( 'avg5', load[1] );
			mqtt.publish( 'avg15', load[2] );
		} );
	}

}
