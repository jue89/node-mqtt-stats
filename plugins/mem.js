'use strict';

const fs = require( '../lib/fs.js' );
const interval = require( '../lib/interval.js' );

module.exports = function( config, mqtt ) {

	if( typeof config != 'object' ) config = {};
	if( typeof config.interval != 'number' ) config.interval = 10000;

	fs.stat( '/proc/meminfo' ).then( () => {
		console.log( "Start publishing mem" );
		interval.create( "mem", config.interval, pubMem );
	} ).catch( () => {} );


	const REmem = /^([a-zA-Z]+): *([0-9]+) kB$/;
	function pubMem() {
		return fs.readFile( '/proc/meminfo' ).then( ( file ) => {
			file = file.toString().split( '\n' );

			let mem = {};
			for( let line of file ) {
				let tmp = REmem.exec( line );
				if( ! tmp ) continue;
				mem[tmp[1]] = parseInt( tmp[2] );
			}

			mqtt.publish( 'used', mem.MemTotal - mem.MemFree );
			mqtt.publish( 'free', mem.MemFree );
			mqtt.publish( 'buffers', mem.Buffers );
			mqtt.publish( 'cached', mem.Cached );
			mqtt.publish( 'swapused', mem.SwapTotal - mem.SwapFree );
			mqtt.publish( 'swapfree', mem.SwapFree );
		} );
	}

}
