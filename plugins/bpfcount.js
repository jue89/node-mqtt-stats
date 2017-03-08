'use strict';

const net = require( 'net' );
const fs = require( '../lib/fs' );
const unixsocket = require( '../lib/unixsocket' );
const interval = require( '../lib/interval.js' );

module.exports = function( config, mqtt ) {

	if( typeof config != 'object' ) config = {};

	if( config.sockets ) {
		console.log( "Start publishing stats of bpfcountd probes" );
		interval.create( "bpfcount", 2000, pubBpfcount );
	}

	function pubBpfcount() {
		// Get socket list
		let sockets = {};
		switch( typeof config.sockets ) {
			// Callback method
			case 'function': sockets = config.sockets(); break;
			// Static socket list
			case 'object': sockets = config.sockets; break;
		}

		// Publish stats for each socket
		let jobs = [];
		for( let name in sockets ) {
			jobs.push( pubBpfcountSocket( name, sockets[name] ) );
		}

		return Promise.all( jobs );
	}

	let last = {};
	function pubBpfcountSocket( name, path ) {
		// Get status from unix socket
		return unixsocket.query( path ).then( ( stats ) => {
			let ts = Date.now() / 1000;
			// One metric per line
			for( let probe of stats.split('\n') ) {
				// Every line:
				// METRIC_NAME:BYTES_CNT:PACKETS_CNT
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
