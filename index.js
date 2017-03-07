'use strict';

const fs = require( 'fs' );
const Mqtt = require( './mqtt.js' );
const interval = require( './lib/interval.js' );


const config = require( './config.js' );

let pluginShutdown = [];

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
		let ret = require( `./plugins/${f}` )( pConfig, new Mqtt( pName ) );
		if( typeof ret == 'function' ) pluginShutdown.push( ret );
	} catch( e ) {
		console.error( `Loading ${f} failed: ${e.stack}` );
	}

}


// Shutdown all plugins
function shutdown() {

	// Clear all running intervals
	interval.clearAll();

	// Call all shutdown handler
	let runningShutdowns = [];
	for( let s of pluginShutdown ) runningShutdowns.push( s() );

	// Wait for all handlers and then exit
	Promise.all( runningShutdowns ).then( () => process.exit() );

}
process.once( 'SIGINT', shutdown ).once( 'SIGTERM', shutdown );
