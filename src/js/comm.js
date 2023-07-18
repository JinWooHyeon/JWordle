'use strict'

console.log( '[Load comm.js]' );

const boardLength = {
	maxRowLen: 6
	, wordLen: 5
}

const LocalStorage = function() {
	const ls = localStorage;

	this.getItem = () => { 
		return ls.getItem( 'snapshot' );
	};

	this.setItem = ( state ) => {
		ls.setItem( 'snapshot', JSON.stringify( state ) );
	}
}

const ls = new LocalStorage();

const Toast = function() {
	this.showToast = function( alertType = 'comfirm', text, duration = '1000' ) {
		let backgroundColor = 'linear-gradient(to right, #00b09b, #96c93d)';
	
		if ( 'warning' === alertType ) {
			backgroundColor = 'linear-gradient(to right, #b59f3b, #f5793a)';
		}
	
		Toastify( {
			text: text,
			duration: duration,
			// destination: "https://github.com/apvarun/toastify-js",
			newWindow: true,
			close: true,
			gravity: 'top', // `top` or `bottom`
			position: 'center', // `left`, `center` or `right`
			offset: {
				x: ''
				, y: '0px'
			},
			stopOnFocus: true, // Prevents dismissing of toast on hover
			style: {
				background: backgroundColor,
			},
			onClick: function(){  } // Callback after click
		} ).showToast();
	}

	this.removeToastAll = function() {
		document.querySelectorAll( '.toastify' ).forEach( ( e ) => {
			e.remove();
		} );
	}
}

const toast = new Toast();

const Dictionary = ( word = '' ) => {
	return new Promise( ( resolve, reject ) => {
		console.time( 'dictionary' );

		$.ajax( {
			url: `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`
			, type: 'GET'
			, contentType: 'application/json'
			, success: ( resp ) => {
				if ( resp ) {
					console.timeEnd( 'dictionary' );

					resolve( resp );
				} else {
					console.log( 'failed' );
				}
			}
			, error : ( e ) => {
				console.timeEnd( 'dictionary' );

				reject( e );
			}
		} );
	} );
}

function Timer( elemID, options ) {
	const stopwatch = document.querySelector( elemID );
	stopwatch.replaceChildren( '' );

	options = options || {};
	options.format = options.format || 'HH:mm:ss.SSS';
	options.startTime = options.startTime || 0;
	options.endTime = options.endTime || 0;

	const timer = new Stopwatch( stopwatch, {
		format: options.format
		, startTime: options.startTime
		, endTime: options.endTime
		, delay: 1
		, buttons: { start: false, stop: false, reset: false }
	} );

	if ( ( 0 !== options.startTime ) && ( 0 === options.endTime ) ) {
		timer.start();
	} else {
		timer.setPrevTime();
	}

	return timer;
}

// Basic examples
// const elems = document.getElementsByClassName( 'basic' );
// for ( let i = 0; i < elems.length; i++ ) {
//     new Stopwatch(elems[i]);
// }

// Programmatic examples
// let timer = document.getElementById( 'stopwatch' );
// let aTimer = new Stopwatch( a, { delay: 1 } );
// aTimer.start();
const Stopwatch = function( elem, options ) {
	const timer = createTimer(),
	startButton = createButton( 'start', start ),
	stopButton = createButton( 'stop', stop ),
	resetButton = createButton( 'reset', reset );

	let offset, clock, interval;

	options = options || {};
	options.format = options.format || 'HH : mm : ss SSS';
	options.startTime = options.startTime || 0;
	options.endTime = options.endTime || 0;
	options.delay = options.delay || 1;
	options.buttons.start = options.buttons.start
	options.buttons.stop = options.buttons.stop;
	options.buttons.reset = options.buttons.reset;

	elem.appendChild( timer	);
	elem.appendChild( createButtonDiv() );

	reset();

	function createTimer() {
		const timer = document.createElement( 'span' );
		timer.className = 'timerContainer';

		return timer;
	}

	function createButtonDiv() {
		const buttons = document.createElement( 'div' );
		buttons.className = 'buttons';

		if ( options.buttons.start ) { buttons.appendChild( startButton ); }
		if ( options.buttons.stop ) { buttons.appendChild( stopButton ); }
		if ( options.buttons.reset ) { buttons.appendChild( resetButton ); }

		return buttons;
	}

	function createButton( action, handler ) {
		const a = document.createElement( 'a' );
		a.href = '#' + action;
		a.textContent = action;
		a.className = 'button';

		a.addEventListener( 'click', function( e ) {
			handler( options.startTime );
			e.preventDefault();
		} );

		return a;
	}

	this.setPrevTime = ( startTime = options.startTime, endTime = options.endTime ) => {
		if ( ( startTime > 0 ) && ( endTime > 0 ) ) { clock = endTime - startTime; }
		render();
	}

	function start( startTime = options.startTime ) {
		if ( startTime > 0 ) { clock = Date.now() - startTime; }

		if ( !interval ) {
			offset = Date.now();
			interval = setInterval( update, options.delay );
		}
	}

	function stop() {
		if ( interval ) {
			clearInterval( interval );
			interval = null;
		}
	}

	function reset() {
		clock = 0;
		render();
	}

	function update() {
		clock += delta();
		render();
	}

	function render( format = options.format ) {
		timer.textContent = moment().hour( 0 ).minute( 0 ).second( 0 ).millisecond( clock ).format( format );
	}

	function delta() {
		const now = Date.now(), d = ( now - offset );

		offset = now;
		return d;
	}

	this.start = start;
	this.stop = stop;
	this.reset = reset;
};

// Basic examples
// const enc = wordle.setWordle( 'abuse' );
// const dec = wordle.getWordle( enc );
// console.log( `enc: ${enc}, dec: ${dec}` );

// console.log( `${location.origin}/?${enc}` );
const Wordle = function() {
	// Bijection algorithm
	const Bijection = function() {
		const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
		const base = alphabet.length;
	
		this.encode = function encode( num ) {
			let encoded = '';
	
			while ( num ) {
				const remainder = ( num % base );
				num = Math.floor( num / base );
				encoded = alphabet[remainder].toString() + encoded;
			}
	
			return encoded;
		}
	
		this.decode = function decode( str ) {
			let decoded = 0;
	
			while ( str ) {
				const index = alphabet.indexOf( str[0] );
				const power = ( str.length - 1 );
				decoded += index * ( Math.pow( base, power ) );
				str = str.substring( 1 );
			}
	
			return decoded;
		}
	}

	const RandomMinMax = { min: 23, max: 50 };

	function getRandomInt( min, max ) {
		min = Math.ceil( min );
		max = Math.floor( max );

		return Math.floor( Math.random() * ( max - min ) ) + min; //exclude max val, include min val
	}

	const bijection = new Bijection();
	let salt;
	let encSecret = '';
	let decSecret = '';
	
	this.setWordle = ( secret = 'world' ) => {
		encSecret = '';
		salt = getRandomInt( RandomMinMax.min, RandomMinMax.max );
		let arrSecret = [ ...secret ];

		// console.log( `salt : ${salt}` );
		// console.log( `secret : ${secret}, arrSecret: ${arrSecret}` );

		for ( const key of arrSecret ) {
			const encChar = ( key.charCodeAt() - salt );
			
			encSecret += encChar.toString();
		}

		encSecret = encSecret + salt.toString();
		// console.log( `encString : ${encSecret}` );

		encSecret = bijection.encode( encSecret );
		// console.log( `encode( encString ) : ${encSecret}` );

		return encSecret;
	}

	this.getWordle = ( encSecret ) => {
		decSecret = '';
		decSecret = bijection.decode( encSecret ).toString();
		// console.log( `decode( encString ) : ${decSecret}` );

		let result = decSecret.match( /.{1,2}/g );

		salt = result[( result.length - 1 )];

		result.splice( result.length - 1 );

		result = result.map( x => parseInt( x ) + parseInt( salt ) );
		result = result.map( x => String.fromCharCode( x ) );

		return result.join( '' );
	}
}

const wordle = new Wordle();
