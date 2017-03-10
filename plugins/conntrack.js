'use strict';

const fs = require( '../lib/fs.js' );
const interval = require( '../lib/interval.js' );

module.exports = function( config, mqtt ) {

	if( typeof config != 'object' ) config = {};
	if( typeof config.interval != 'number' ) config.interval = 10000;

	fs.stat( '/proc/sys/net/netfilter/nf_conntrack_count' ).then( () => {
		console.log( "Start publishing conntrack size" );
		interval.create( "conntrack", config.interval, pubConntrack );
	} ).catch( () => {} );


	function pubConntrack() {
		return fs.readFile( '/proc/sys/net/netfilter/nf_conntrack_count' ).then( ( conntrack ) => {
			mqtt.publish( conntrack );
		} );
	}

}
