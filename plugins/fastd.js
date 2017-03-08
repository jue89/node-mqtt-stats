'use strict';

const net = require( 'net' );
const fs = require( '../lib/fs' );
const unixsocket = require( '../lib/unixsocket' );
const interval = require( '../lib/interval.js' );


module.exports = function( config, mqtt ) {

	if( typeof config != 'object' ) config = {};

	if( config.sockets ) {
		console.log( "Start publishing fastd stats" );
		interval.create( "fastd", 10000, pubFastd );
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

	function pubFastdSocket( name, path ) {
		// Get status from unix socket
		return unixsocket.query( path ).then( ( stats ) => {
			let ts = Date.now() / 1000;
			try {
				stats = JSON.parse( stats );
				let peers_online = 0;
				let peers = 0;
				for( let p in stats.peers ) {
					peers++;
					if( ! stats.peers[p].connection ) peers_online++;
				}
				mqtt.publish( `${name}/peers`, peers );
				mqtt.publish( `${name}/peers_online`, peers_online );
			} catch( e ) { console.error( e.stack ); }
		} );
	}

}
