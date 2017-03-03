'use strict';

const net = require( 'net' );
const fs = require( 'fs' );

module.exports = function( config, mqtt ) {

	if( typeof config == 'object' ) for( let name in config ) {
		if( fs.statSync( config[name] ).isSocket() ) {
			console.log( "Start publishing stats of fastd connection " + name );
			pubFastd( name, config[name] );
			setInterval( () => pubFastd( name, config[name] ), 10000 );
		}
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
