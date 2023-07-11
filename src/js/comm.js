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
