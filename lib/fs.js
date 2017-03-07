'use strict';

const fs = require( 'fs' );


function promisify( method ) {

	return function() {

		// Preserve arguments
		// This hacky line converts the arugments object into an array
		let args = Array.prototype.slice.call( arguments );

		return new Promise( ( resolve, reject ) => {

			// Get arguments and append callback function
			args.push( ( err, res ) => {
				if( err ) return reject( err );
				return resolve( res );
			} );

			// Call the method and let the magic happen
			method.apply( this, args );

		} );

	}

}

[ 'stat', 'readFile', 'readdir' ].forEach( ( m ) => {
	module.exports[ m ] = promisify( fs[m] );
} );
