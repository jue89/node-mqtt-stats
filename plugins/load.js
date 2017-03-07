'use strict';

const fs = require( '../lib/fs.js' );
const interval = require( '../lib/interval.js' );

module.exports = function( config, mqtt ) {

	fs.stat( '/proc/loadavg' ).then( () => {
		console.log( "Start publishing load" );
		interval.create( "load", 10000, pubLoad );
	} ).catch( () => {} );


	function pubLoad() {
		return fs.readFile( '/proc/loadavg' ).then( ( load ) => {
			load = load.toString().split( ' ' );
			mqtt.publish( 'avg1', load[0] );
			mqtt.publish( 'avg5', load[1] );
			mqtt.publish( 'avg15', load[2] );
		} );
	}

}
