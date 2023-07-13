'use strict'

console.log( '[Load index.js]' );

const ls = localStorage;

let boardLength = {
	maxRowLen: 6
	, wordLen: 5
}

let state = {
	// secret: dictionary[ Math.floor( Math.random() * dictionary.length ) ]
	secret: 'dolly'
	, grid: Array( boardLength.maxRowLen )
				.fill().map( () => Array( boardLength.wordLen ).fill( '' ) )
	, currRowIdx: 0
	, currColIdx: 0
	, winRowIdx: 0
	, isWinner: false
	, isGameOver: false
	, isFin: false
	, isInputable: true
	, animation_duration: 500
}

document.addEventListener( 'DOMContentLoaded', () => {
	console.log( 'Start DOMContentLoaded' );

	init();
} );

function init() {
	console.log( 'Start JWordle' );

	const board = document.getElementById( 'board' );
	// board.style = `grid-template-rows: repeat( ${boardLength.maxRowLen}, 1fr )`;

	drawGrid( board, boardLength.maxRowLen, boardLength.wordLen );

	if ( ls.getItem( 'snapshot' ) ) {
		state = JSON.parse( ls.getItem( 'snapshot' ) );

		setPrevWords();
	}

	addKeyboardEventListener();
	addDialogEventListener( state );
}

function drawGrid( board, maxRowLen, wordLen ) {
	let row;

	for ( let i = 0; i < maxRowLen; i++ ) {
		row = document.createElement( 'div' );
		row.id = `row${i}`;
		row.className = "row";

		for ( let j = 0; j < wordLen; j++ ) {
			drawCard( row, i, j );
		}

		board.appendChild( row );
	}
}

function drawCard( container, row, col, letter = '' ) {
	const card = document.createElement( 'div' );

	card.className = 'card';
	card.id = `card${row}${col}`;
	card.textContent = letter;
	card.setAttribute( 'data-state', 'empty' );

	container.appendChild( card );
}

function setPrevWords() {
	let word;

	state.winRowIdx = 0;
	state.isWinner = false;
	state.isGameOver = false;
	state.isFin = false;

	updateGrid();

	for ( let i = 0; i < state.currRowIdx; i++ ) {
		setTimeout( () => {
			word = getWord( i );

			revealWord( i, word, 200 );
		}, ( i * 100 ) );
	}
}

function addKeyboardEventListener() {
	document.body.onkeydown = ( e ) => {
		const key = e.key;

		if ( !state.isInputable ) {
			return;
		}

		if ( 'Enter' === key ) {
			const word = getWord( state.currRowIdx );
			const row = document.getElementById( `row${state.currRowIdx}` );
			let textContent;

			if ( boardLength.wordLen !== state.currColIdx ) {
				textContent = 'Not enough letters';

				rejectWord( textContent, row );
				return;
			}

			isWordValid( word )
				.then( ( resp ) => {
					revealWord( state.currRowIdx, word );

					state.currRowIdx++;
					state.currColIdx = 0;

					ls.setItem( 'snapshot', JSON.stringify( state ) );
				} )
				.catch( ( err ) => {
					textContent = 'Not in word list';

					rejectWord( textContent, row );
				} );
		}

		if ( 'Backspace' === key ) {
			removeLetter();
		}

		if ( ( !state.isWinner && !state.isGameOver ) && ( isLetter( key ) ) ) {
			addLetter( key );
		}

		updateGrid();
	}
}

function getWord( rowIdx ) {
	// return state.grid[rowIdx].reduce( ( prev, curr ) => prev + curr );
	return state.grid[rowIdx].join( '' );
}

function rejectWord( textContent, row ) {
	drawToast( textContent );

	row.classList.add( 'invalid' );
	setTimeout( () => {
		row.classList.remove( 'invalid' );
	}, state.animation_duration );
}

function isWordValid( word ) {
	return new Promise( ( resolve, reject ) => {
		dictionary( word )
			.then( ( resp ) => {
				resolve( ( 0 !== resp.length ) );
			} )
			.catch( ( err ) => {
				reject( false );
			} );
	} );
}

function revealWord( rowIdx, guess, animation_duration = state.animation_duration ) {
	state.isInputable = false;

	updateRow( rowIdx, guess );

	flipRow( rowIdx, animation_duration );
}

function updateRow( rowIdx, guess ) {
	const row = document.getElementById( `row${rowIdx}` );

	row.lastChild.addEventListener( 'animationend', ( e ) => {
		updateState( rowIdx, guess );

		state.isInputable = true;

		if ( !e.target.classList.contains( 'win' ) ) {
			drawFinish();
		}
	} );
}

function updateState( rowIdx, guess ) {
	state.isWinner = ( state.secret === guess );
	state.winRowIdx = ( state.isWinner ) ? ( state.currRowIdx - 1 ) : 0;
	state.isGameOver = ( ( boardLength.maxRowLen - 1 ) === rowIdx );
	state.isFin = ( state.isWinner || state.isGameOver );
}

function flipRow( rowIdx, animation_duration ) {
	let dataState;
	
	for ( let i = 0; i < boardLength.wordLen; i++ ) {
		const card = document.getElementById( `card${rowIdx}${i}` );
		const letter = card.textContent;

		setTimeout( () => {
			if ( state.secret[i] === letter ) {
				dataState = 'correct';
			} else if ( state.secret.includes( letter ) ) {
				dataState = 'present';
			} else {
				dataState = 'absent';
			}

			card.setAttribute( 'data-state', dataState );
		}, ( ( i + 1 ) * animation_duration ) / 2 );

		card.classList.add( 'flipped' );
		card.style.animationDelay = `${ ( i * animation_duration ) / 2 }ms`;
	}
}

function drawFinish() {
	let textFin;

	if ( state.isWinner ) {
		const winRow = document.getElementById( `row${state.winRowIdx}` );

		winRow.childNodes.forEach( ( e ) => {
			const rowIdx = e.id.replace( `card${state.winRowIdx}`, '' );

			e.style.animationDelay = `${ ( rowIdx * 100 ) }ms`;

			e.classList.remove( 'flipped' );
			e.classList.add( 'win' );
		} );

		textFin = 'Congratulations!';
	} else if ( state.isGameOver ) {
		textFin = `Better luck next time! The word was ${state.secret}.`;
	}

	if ( state.isFin ) {
		drawToast( textFin, 0 );
	}
}

function removeLetter() {
	if ( 0 === state.currColIdx ) {
		return;
	}
	
	state.currColIdx--;
	state.grid[ state.currRowIdx ][ ( state.currColIdx ) ] = '';

	setCardStatus( 'remove', state.currRowIdx, state.currColIdx );
}

function isLetter( key ) {
	return ( 1 === key.length ) && key.match( /[a-z]/i );
}

function addLetter( letter ) {
	if ( boardLength.wordLen === state.currColIdx ) {
		return;
	}

	state.grid[ state.currRowIdx ][ state.currColIdx ] = letter;

	setCardStatus( 'add', state.currRowIdx, state.currColIdx );

	state.currColIdx++;
}

function setCardStatus( status, row, col ) {
	const valAnimation = ( 'add' === status ) ? 'pop' : 'idle';
	const valState = ( 'add' === status ) ? 'tbd' : 'empty';

	const card = document.getElementById( `card${row}${col}` );
	card.setAttribute( 'data-animation', valAnimation );
	card.setAttribute( 'data-state', valState );

	setTimeout( () => {
		card.setAttribute( 'data-animation', 'idle' );
	}, ( state.animation_duration / 5 ) );
}

function updateGrid() {
	for ( let i = 0; i < boardLength.maxRowLen; i++ ) {
		for ( let j = 0; j < boardLength.wordLen; j++ ) {
			const card = document.getElementById( `card${i}${j}` );
			card.textContent = state.grid[i][j];
		}
	}
}
