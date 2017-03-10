'use strict';

const spawn = require( 'child_process' ).spawn;
const exec = require( 'child_process' ).exec;

const REaddr = /((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(\.|$)){4}/;
const REping = /^\[([0-9.]*)\].*time=([0-9.]+) ms$/;

module.exports = function( config, mqtt ) {

	// Some defaults
	if( typeof config != 'object' ) config = {};
	if( typeof config.interval != 'number' ) config.interval = 2000;
	config.interval /= 1000;

	// Check if correct ping tool is installed
	if( config.hosts instanceof Array ) exec( 'ping -V', ( err, stdout, stderr ) => {
		if( err || stdout.indexOf( 'iputils' ) == -1 ) {
			console.log( "Ping of iputils must be installed" );
			return;
		}

		// Kickoff ping
		for( let host of config.hosts ) {
			if( ! REaddr.test( host ) ) {
				console.error( `${host} is no IPv4` );
				continue;
			}
			console.log( "Start publishing ping to " + host );
			setImmediate( () => pubPing( host ) );
		}
	} );



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


	return function() {
		for( let kill of pingKill ) kill();
		return Promise.all( pingClosed );
	}

}
