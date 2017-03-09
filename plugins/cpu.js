'use strict';

const fs = require( '../lib/fs.js' );
const interval = require( '../lib/interval.js' );

module.exports = function( config, mqtt ) {

	if( typeof config != 'object' ) config = {};
	if( typeof config.interval != 'number' ) config.interval = 10000;

	fs.stat( '/proc/stat' ).then( () => {
		console.log( "Start publishing cpu stats" );
		interval.create( "cpu", config.interval, pubCpu );
	} ).catch( () => {} );


	const REline = /^([a-zA-Z]+) +(.*)$/;
	let last;
	function pubCpu() {
		return fs.readFile( '/proc/stat' ).then( ( stat ) => {
			stat = stat.toString().split( '\n' );
			for( let l of stat ) {

				// Search cpu info
				let tmp = REline.exec( l );
				if( ! tmp ) continue;
				if( tmp[1] != 'cpu' ) continue;

				// Read cpu info
				let cpu = tmp[2].split(' ');
				for( let i = 0; i < 10; i++ ) cpu[i] = cpu[i] ? parseInt( cpu[i] ) : 0;

				if( last ) {
					let jiffies = 0;
					let cpudiff = [];
					for( let i = 0; i < 10; i++ ) {
						cpudiff[i] = cpu[i] - last[i];
						jiffies += cpudiff[i];
					}
					const scale = ( j ) => Math.round( j / jiffies * 100 );
					// See: http://man7.org/linux/man-pages/man5/proc.5.html
					mqtt.publish( 'user',    scale( cpudiff[0] + cpudiff[1] ) );
					mqtt.publish( 'system',  scale( cpudiff[2] ) );
					mqtt.publish( 'idle',    scale( cpudiff[3] ) );
					mqtt.publish( 'iowait',  scale( cpudiff[4] ) );
					mqtt.publish( 'irq',     scale( cpudiff[5] ) );
					mqtt.publish( 'softirq', scale( cpudiff[6] ) );
					mqtt.publish( 'steal',   scale( cpudiff[7] + cpudiff[8] + cpudiff[9] ) );
				}

				last = cpu;
				break;
			}
		} );
	}

}

