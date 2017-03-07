'use strict';

let timerid = 0;
let runningTimers = {};


/**
 * A better setTimer ...
 * name:   callee name
 * period: time between two executions
 * method: to be called
 * args:   arguments to be passed
 */

function interval( name, period, method, args ) {

	let ret = method.apply( this, args );

	// Wait for the method to finish
	if( !( ret instanceof Promise ) ) ret = Promise.resolve();
	ret.then( () => nextInterval() ).catch( ( e ) => {

		// If an error occured, report it and start over again
		console.error( name, e );
		nextInterval();

	} );

	function nextInterval() {

		// Create new timer instance
		let myid = timerid++;
		runningTimers[myid] = setTimeout( () => {

			// Before calling the method delete timer reference
			delete runningTimers[myid];
			interval( name, period, method, args );

		}, period );

	}

}


/**
 * Clears all running timers
 */

function clear() {
	for( let t in runningTimers ) clearTimeout( runningTimers[t] );
}


module.exports = {
	create: interval,
	clearAll: clear
};
