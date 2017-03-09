'use strict';

const net = require( 'net' );
const fs = require( '../lib/fs' );
const unixsocket = require( '../lib/unixsocket' );
const interval = require( '../lib/interval.js' );


module.exports = function( config, mqtt ) {

	if( typeof config != 'object' ) config = {};
	if( typeof config.interval != 'number' ) config.interval = 2000;
	if( ! ( typeof config.observe == 'boolean' || config.observe instanceof Array ) ) config.observe = false;

	if( config.sockets ) {
		console.log( "Start publishing fastd stats" );
		interval.create( "fastd", config.interval, pubFastd );
	}

	function pubFastd() {
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
			jobs.push( pubFastdSocket( name, sockets[name] ) );
		}

		return Promise.all( jobs );
	}

	let last = {};
	function pubFastdSocket( name, path ) {
		// Get status from unix socket
		return unixsocket.query( path ).then( ( stats ) => {
			try {
				stats = JSON.parse( stats );
			} catch( e ) { return Promise.reject( e ); }

			let peers_online = 0;
			let peers = 0;
			for( let p in stats.peers ) {
				peers++;

				// Next if peer is offline
				if( ! stats.peers[p].connection ) continue;
				peers_online++;

				// Next if peer should not be observed
				if( config.observe === false ) continue;
				let name = stats.peers[p].name;
				if( config.observe.length ) {
					let next = true;
					for( let o of config.observe ) {
						if( typeof o == 'string' && o == name ) next = false;
						if( o instanceof RegExp && o.test( name ) ) next = false;
					}
					if( next ) continue;
				}

				let ts = Date.now() / 1000;
				let tx_bytes = stats.peers[p].connection.statistics.tx.bytes;
				let rx_bytes = stats.peers[p].connection.statistics.rx.bytes;
				let tx_packets = stats.peers[p].connection.statistics.tx.packets;
				let rx_packets = stats.peers[p].connection.statistics.rx.packets;

				if( last[p] ) {
					let tx_bytes_rate = Math.round( ( tx_bytes - last[p][1] ) / ( ts - last[p][0] ) );
					let rx_bytes_rate = Math.round( ( rx_bytes - last[p][2] ) / ( ts - last[p][0] ) );
					let tx_packets_rate = Math.round( ( tx_packets - last[p][3] ) / ( ts - last[p][0] ) );
					let rx_packets_rate = Math.round( ( rx_packets - last[p][4] ) / ( ts - last[p][0] ) );
					mqtt.publish( `${name}/tx_bytes`, tx_bytes_rate );
					mqtt.publish( `${name}/rx_bytes`, rx_bytes_rate );
					mqtt.publish( `${name}/tx_packets`, tx_packets_rate );
					mqtt.publish( `${name}/rx_packets`, rx_packets_rate );
				}

				last[p] = [ ts, tx_bytes, rx_bytes, tx_packets, rx_packets ];
			}

			mqtt.publish( `${name}/peers`, peers );
			mqtt.publish( `${name}/peers_online`, peers_online );
		} );
	}

}
