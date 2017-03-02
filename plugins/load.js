const fs = require( 'fs' );

module.exports = function( config, mqtt ) {

	if( fs.existsSync( '/proc/loadavg' ) ) {
		console.log( "Start publishing load" );
		pubLoad();
		setInterval( () => pubLoad(), 10000 );
	}


	function pubLoad() {
		fs.readFile( '/proc/loadavg', ( err, load ) => {
			if( err ) throw err;
			load = load.toString().split( ' ' );
			mqtt.publish( 'avg1', load[0] );
			mqtt.publish( 'avg5', load[1] );
			mqtt.publish( 'avg15', load[2] );
		} );
	}

}
