'use strict'

console.log( '[Load comm.js]' );

function drawToast( text, duration = '1000' ) {
	Toastify( {
		text: text,
		duration: duration,
		// destination: "https://github.com/apvarun/toastify-js",
		newWindow: true,
		close: true,
		gravity: "top", // `top` or `bottom`
		position: "center", // `left`, `center` or `right`
		offset: {
			x: ''
			, y: '0px'
		},
		stopOnFocus: true, // Prevents dismissing of toast on hover
		style: {
		  background: "linear-gradient(to right, #00b09b, #96c93d)",
		},
		onClick: function(){} // Callback after click
	  } ).showToast();
}

const dictionary = ( word = '' ) => {
	return new Promise( ( resolve, reject ) => {
		console.time();

		$.ajax( {
			url: `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`
			, type: 'GET'
			, contentType: 'application/json'
			, success: ( resp ) => {
				if ( resp ) {
					console.timeEnd();

					resolve( resp );
				} else {
					console.log( 'failed' );
				}
			}
			, error : ( e ) => {
				console.timeEnd();

				reject( e );
			}
		} );
	} );
}

// Bijection algorithm
var alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
var base = alphabet.length;

function encode(num){
  var encoded = '';
  while (num){
    var remainder = num % base;
    num = Math.floor(num / base);
    encoded = alphabet[remainder].toString() + encoded;
  }
  return encoded;
}

function decode(str){
  var decoded = 0;
  while (str){
    var index = alphabet.indexOf(str[0]);
    var power = str.length - 1;
    decoded += index * (Math.pow(base, power));
    str = str.substring(1);
  }
  return decoded;
}

