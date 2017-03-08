'use strict';

const fs = require( '../lib/fs' );
const interval = require( '../lib/interval.js' );

module.exports = function( config, mqtt ) {

	if( typeof config !== 'object' ) config = {};
	if( typeof config.interval != 'number' ) config.interval = 2000;
	if( ! ( config.ignore instanceof Array ) ) config.ignore = [];

	fs.stat( '/sys/class/net' ).then( ( s ) => {
		if( ! s.isDirectory() ) return;
		console.log( "Start publishing if stats" );
		interval.create( "if", config.interval, pubInterfaces );
	} ).catch( () => {} );


	function pubInterfaces() {
		return fs.readdir( '/sys/class/net' ).then( ( interfaces ) => {
			let jobs = [];
			for( let i of interfaces ) {
				if( config.ignore.indexOf( i ) !== -1 ) continue;
				jobs.push( pubStat( i, 'tx_bytes' ) );
				jobs.push( pubStat( i, 'rx_bytes' ) );
				jobs.push( pubStat( i, 'tx_packets' ) );
				jobs.push( pubStat( i, 'rx_packets' ) );
			}
			return Promise.all( jobs );
		} );
	}

	let last = {};
	function pubStat( i, j ) {
		const topic = `${i}/${j}`;
		const ts = Date.now() / 1000;

		return fs.readFile( `/sys/class/net/${i}/statistics/${j}` ).then( ( value ) => {
			value = parseInt( value );

			if( last[topic] ) {
				let rate = Math.round( ( value - last[topic][1] ) / ( ts - last[topic][0] ) );
				mqtt.publish( topic, rate );
			}

			last[topic] = [ ts, value ];
		} );
	}

}
