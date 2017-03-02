'use strict';

const fs = require( 'fs' );
const Mqtt = require( './mqtt.js' );


const config = require( './config.js' );

// Read plugin folder
const REjs = /^(.*)\.js$/;
for( let f of fs.readdirSync( './plugins' ) ) {

	// Skip all non-js files
	let tmp = REjs.exec( f );
	if( tmp == null ) continue;

	let pName = tmp[1];
	let pConfig = config[pName];

	// Skip if config name is "global" - this config name ist reserved!
	if( pName == "global" ) continue;

	// Load plugin
	try {
		require( `./plugins/${f}` )( pConfig, new Mqtt( pName ) );
	} catch( e ) {
		console.error( `Loading ${f} failed: ${e.stack}` );
	}

}
