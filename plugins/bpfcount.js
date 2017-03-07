'use strict';

const net = require( 'net' );
const fs = require( 'fs' );
const interval = require( '../lib/interval.js' );

module.exports = function( config, mqtt ) {

	if( typeof config == 'object' ) for( let name in config ) {
		if( fs.statSync( config[name] ).isSocket() ) {
			console.log( "Start publishing stats of bpfcountd probe " + name );
			interval.create( "bpfcount", 2000, pubBpfcount, [ name, config[name] ] );
		}
	}

	let last = {};
	function pubBpfcount( name, path ) {
		// Connect to socket and fetch current counters
		let stats = '';
		net.connect( path ).on( 'data', ( d ) => {
			stats += d.toString();
		} ).on( 'end', () => {
			// Once disconnected, process retrieved stats
			let ts = Date.now() / 1000;
			for( let probe of stats.split('\n') ) {
				let tmp = probe.split(':');
				if( tmp.length != 3 ) continue;

				let id = tmp[0];
				let bytes = parseInt( tmp[1] );
				let packets = parseInt( tmp[2] );

				let key = `${name}/${id}`;

				if( last[key] ) {
					// Calculate rates between last and current counters
					let bytesRate = Math.round( ( bytes - last[key][1] ) / ( ts - last[key][0] ) );
					let packetsRate = Math.round( ( packets - last[key][2] ) / ( ts - last[key][0] ) );
					mqtt.publish( `${key}/bytes`, bytesRate );
					mqtt.publish( `${key}/packets`, packetsRate );
				}

				last[key] = [ ts, bytes, packets ];
			}
		} );
	}

}
