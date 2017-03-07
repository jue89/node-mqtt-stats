'use strict';

const fs = require( '../lib/fs' );
const interval = require( '../lib/interval.js' );

module.exports = function( config, mqtt ) {

	if( typeof config !== 'object' ) config = {};
	if( ! ( config.ignore instanceof Array ) ) config.ignore = [];

	fs.readdir( '/sys/class/net' ).then( ( interfaces ) => {
		for( let i of interfaces ) {
			if( config.ignore.indexOf( i ) !== -1 ) continue;
			console.log( "Start publishing if stats for " + i );
			interval.create( "if", 2000, pubInterface, [ i ] );
		}
	} ).catch( () => {} );


	function pubInterface( i ) {
		return Promise.all( [
			pubStat( i, 'tx_bytes' ),
			pubStat( i, 'rx_bytes' ),
			pubStat( i, 'tx_packets' ),
			pubStat( i, 'rx_packets' )
		] );
	}

	let last = {};
	function pubStat( i, j ) {
		const topic = `${i}/${j}`;
		const ts = Date.now() / 1000;

		return fs.readFile( `/sys/class/net/${i}/statistics/${j}` ).then( ( value ) => {
			value = parseInt( value );

			if( last[topic] ) {
				let rate = Math.round( ( value - last[topic][1] ) / ( ts - last[topic][0] ) );
				mqtt.publish( topic, rate );
			}

			last[topic] = [ ts, value ];
		} );
	}

}
