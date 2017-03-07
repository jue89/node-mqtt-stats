'use strict';

const net = require( 'net' );
const fs = require( '../lib/fs' );
const interval = require( '../lib/interval.js' );


module.exports = function( config, mqtt ) {

	if( typeof config == 'object' ) for( let name in config ) {
		fs.stat( config[name] ).then( (s) => {
			if( ! s.isSocket() ) return;
			console.log( "Start publishing stats of fastd connection " + name );
			interval.create( "fastd", 10000, pubFastd, [ name, config[name] ] );
		} ).catch( () => {} );
	}


	function pubFastd( name, path ) {
		let stats = '';
		net.connect( path ).on( 'data', ( d ) => {
			stats += d.toString();
		} ).on( 'end', () => {
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
