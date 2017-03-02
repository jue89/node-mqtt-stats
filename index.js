'use strict';

const fs = require( 'fs' );


const config = require( './config.js' );

// Read plugin folder
const REjs = /^(.*)\.js$/;
for( let f of fs.readdirSync( './plugins' ) ) {

	// Skip all non-js files
	let tmp = REjs.exec( f );
	if( tmp == null ) continue;

	// Collect plugin info
	let pName = tmp[1];
	let pConfig = config[pName];

	// Load plugin
	try {
		require( `./plugins/${f}` )( pConfig );
	} catch( e ) {
		console.error( `Loading ${f} failed: ${e.stack}` );
	}

}
