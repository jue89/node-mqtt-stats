'use strict';

const fs = require( '../lib/fs.js' );
const interval = require( '../lib/interval.js' );

module.exports = function( config, mqtt ) {

	if( typeof config != 'object' ) config = {};
	if( typeof config.interval != 'number' ) config.interval = 10000;

	fs.stat( '/proc/stat' ).then( () => {
		console.log( "Start publishing processes stats" );
		interval.create( "processes", config.interval, pubProcesses );
	} ).catch( () => {} );


	const REline = /^([a-zA-Z]+) +(.*)$/;
	const REprocdir = /^[0-9]+$/;
	let last;
	function pubProcesses() {
		return fs.readFile( '/proc/stat' ).then( ( file ) => {
			file = file.toString().split( '\n' );

			// Parse file
			let stat = {};
			for( let line of file ) {
				let tmp = REline.exec( line );
				if( ! tmp ) continue;
				stat[ tmp[1] ] = tmp[2].split(' ');
			}


			let ts = Date.now() / 1000;
			let forks = parseInt( stat.processes );
			let contextSwitches = parseInt( stat.ctxt );

			if( last ) {
				let forkRate = Math.round( ( forks - last[1] ) / ( ts - last[0] ) );
				let contextSwitchRate = Math.round( ( contextSwitches  - last[2] ) / ( ts - last[0] ) );
				mqtt.publish( 'forkrate', forkRate );
				mqtt.publish( 'ctxtrate', contextSwitchRate );
			}

			last = [ ts, forks, contextSwitches ];

			return fs.readdir( '/proc' )
		} ).then( ( proc ) => {
			let jobs = [];
			for( let p of proc ) {
				if( ! REprocdir.test( p ) ) continue;
				jobs.push( inspectProcess( p ) );
			}
			return Promise.all( jobs );
		} ).then( ( proc ) => {
			let zombies = 0;
			let tasks = 0;
			let threads = 0;
			let kthreads = 0;

			for( let p of proc ) {
				switch( p[0] ) {
					case 'Z': zombies++; break;
					case 'K': kthreads++; break;
					case 'T': tasks++; threads += p[1]; break;
				}
			}

			mqtt.publish( 'zombies', zombies );
			mqtt.publish( 'tasks', tasks );
			mqtt.publish( 'threads', threads );
			mqtt.publish( 'kthreads', kthreads );
		} );

	}

	function inspectProcess( pid ) {
		return Promise.all( [
			inspectProcessZombie( pid ),
			inspectProcessKthread( pid ),
			inspectProcessThreads( pid )
		] ).then( ( res ) => {
			if( res[0] ) return [ 'Z' ];
			if( res[1] ) return [ 'K' ];
			return [ 'T', res[2] ];
		} ).catch( ( e ) => {
			// Ignore errors silently. They occur if a process ends between scanning /proc
			// and inspecting the process.
			return [ 'x' ];
		} );
	}

	function inspectProcessZombie( pid ) {
		// Check if process is a zombie
		// See: http://stackoverflow.com/questions/16382964/detect-if-pid-is-zombie-on-linux
		return fs.readFile( `/proc/${pid}/status` ).then( ( file ) => {
			file = file.toString().split( '\n' );

			for( let line of file ) {
				if( line.substr( 0, 6 ) == 'State:' ) {
					if( line[7] == 'Z' ) return true;
					break;
				}
			}

			return false;
		} );
	}

	function inspectProcessKthread( pid ) {
		// Check if prcoess is a kernel thread
		// See: http://stackoverflow.com/questions/12213445/identifying-kernel-threads
		return fs.readFile( `/proc/${pid}/cmdline` ).then( ( file ) => {
			return file.length == 0;
		} );
	}

	function inspectProcessThreads( pid ) {
		// Check if prcoess is a kernel thread
		return fs.readdir( `/proc/${pid}/task` ).then( ( dir ) => {
			return dir.length - 1;
		} );
	}
}

