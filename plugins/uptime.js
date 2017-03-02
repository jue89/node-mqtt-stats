const fs = require( 'fs' );

module.exports = function( config, mqtt ) {

	if( fs.existsSync( '/proc/uptime' ) ) {
		console.log( "Start publishing uptime" );
		pubUptime();
		setInterval( () => pubUptime(), 60000 );
	}


	function pubUptime() {
		fs.readFile( '/proc/uptime', ( err, uptime ) => {
			if( err ) throw err;
			uptime = uptime.toString().split( ' ' )[ 0 ];
			mqtt.publish( uptime );
		} );
	}

}
