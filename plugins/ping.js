'use strict';

const spawn = require( 'child_process' ).spawn;

const REaddr = /((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(\.|$)){4}/;
const REping = /^\[([0-9.]*)\].*time=([0-9.]+) ms$/;

module.exports = function( config, mqtt ) {

	let pingClosed = [];
	let pingKill = [];
	function pubPing( host ) {

		let pingProc = spawn( 'ping', [ '-n', '-D', '-i', config.interval, host ] );

		// If the process closed, resolve the promise
		pingClosed.push( new Promise( ( resolve ) => {
			pingProc.on( 'close', () => {
			resolve() } );
		} ) );

		// Store kill call
		pingKill.push( () => pingProc.kill() );

		pingProc.stdout.on( 'data', ( data ) => {
			// Process line by line
			for( let line of data.toString().split( '\n' ) ) {
				let tmp = REping.exec( line );
				if( ! tmp ) continue;
				let timestamp = new Date( Math.round( parseFloat( tmp[1] ) * 1000 ) );
				let rtt = tmp[2];
				mqtt.publish( host, timestamp, rtt );
			}
		} );

		pingProc.stderr.pipe( process.stderr );
	}


	// Some defaults
	if( typeof config != 'object' ) config = {};
	if( typeof config.interval != 'number' ) config.interval = 2000;
	config.interval /= 1000;

	if( config.hosts instanceof Array ) for( let host of config.hosts ) {
		if( ! REaddr.test( host ) ) {
			console.error( `${host} is no IPv4` );
			continue;
		}
		console.log( "Start publishing ping to " + host );
		pubPing( host );
	}


	return function() {
		for( let kill of pingKill ) kill();
		return Promise.all( pingClosed );
	}

}
