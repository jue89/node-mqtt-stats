'use strict';

const fs = require( 'fs' );

module.exports = function( config, mqtt ) {

	if( fs.existsSync( '/sys/class/net' ) ) {
		for( let i of fs.readdirSync( '/sys/class/net' ) ) {
			console.log( "Start publishing if stats for " + i );
			setInterval( () => pubInterface( i ), 2000 );
		}
	}


	function pubInterface( i ) {
		pubStat( i, 'tx_bytes' );
		pubStat( i, 'rx_bytes' );
		pubStat( i, 'tx_packets' );
		pubStat( i, 'rx_packets' );
	}

	let last = {};
	function pubStat( i, j ) {
		const key = `${i}:${j}`;
		const ts = Date.now() / 1000;

		fs.readFile( `/sys/class/net/${i}/statistics/${j}`, ( err, value ) => {
			if( err ) return;
			value = parseInt( value );

			if( last[key] ) {
				let rate = Math.round( ( value - last[key][1] ) / ( ts - last[key][0] ) );
				mqtt.publish( `${i}/${j}`, rate );
			}

			last[key] = [ ts, value ];
		} );
	}
	
}
