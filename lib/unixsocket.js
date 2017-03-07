'use strict';

const net = require( 'net' );

function query( path ) { return new Promise( ( resolve, reject ) => {

	let payload = '';
	net.connect( path ).on( 'data', ( d ) => {
		payload += d.toString();
	} ).on( 'end', () => {
		resolve( payload );
	} ).on( 'error', ( e ) => {
		reject( e );
	} );

} ); }

module.exports = { query };
