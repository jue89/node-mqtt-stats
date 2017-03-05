'use strict';

const fs = require( 'fs' );

function socket2config( dir, re ) {

	// Make sure last character is '/'
	if( dir.substr( -1 ) != '/' ) dir += '/'; 

	// Go through all files in dir and math against the regexp.
	// The returned name is definied by the first group.
	let ret = {};
	for( let file of fs.readdirSync( dir ) ) {
		let tmp = re.exec( file );
		if( ! tmp ) continue;
		ret[ tmp[1] ] = dir + tmp[0];
	}

	return ret;

}

module.exports = {
	"global": {
		"prefix": "org/example",
		"broker": "mqtts://broker.example.com",
		"options": {
			"key": fs.readFileSync( './client.key' ),
			"cert": fs.readFileSync( './client.crt' ),
			"ca": fs.readFileSync( './ca.crt' )
		}
	},
	"ping": [
		"8.8.8.8",
		"8.8.4.4"
	],
	"fastd": socket2config( '/run', /^fastd\.(.*)\.sock$/ ),
	"bpfcount": socket2config( '/run', /^bpfcountd\.(.*)\.sock$/ )
};
