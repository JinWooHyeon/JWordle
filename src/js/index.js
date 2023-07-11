'use strict'

console.log( '[Load index.js]' );

const dictionary = [ 'earth', 'plane', 'crane', 'audio', 'house' ];

let isInputable = true;
let boardLength = {
	maxRowLen: 6
	, wordLen: 5
}

let state = {
	secret: dictionary[ Math.floor( Math.random() * dictionary.length ) ]
	, grid: Array( boardLength.maxRowLen )
				.fill().map( () => Array( boardLength.wordLen ).fill( '' ) )
	, currRowIdx: 0
	, currColIdx: 0
	, winRowIdx: 0
	, isWinner: false
	, isGameOver: false
	, animation_duration: 500
}
const ls = localStorage;

init();

function init() {
	console.log( 'Start JWordle' );

	const board = document.getElementById( 'board' );
	// board.style = `grid-template-rows: repeat( ${boardLength.maxRowLen}, 1fr )`;

	console.log( state.secret );

	drawGrid( board, boardLength.maxRowLen, boardLength.wordLen );

	if ( ls.getItem( 'snapshot' ) ) {
		state = JSON.parse( ls.getItem( 'snapshot' ) );

		console.log( state );
	}

	setPrevWords();

	addKeyboardEventListener();

	console.log( state.secret );
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

	state.isWinner = false;
	state.winRowIdx = 0;

	updateGrid();

	for ( let i = 0; i < state.currRowIdx; i++ ) {
		setTimeout( () => {
			word = '';

			for ( let j = 0; j < boardLength.wordLen; j++ ) {
				word += state.grid[i][j];
			}

			revealWord( state.isWinner, i, word, 200 );
		}, i * 100 );
	}
}

function addKeyboardEventListener() {
	document.body.onkeydown = ( e ) => {
		const key = e.key;

		if ( !isInputable ) {
			return;
		}

		if ( 'Enter' === key ) {
			const word = getCurrWord();
			const row = document.getElementById( `row${state.currRowIdx}` );
			let isPass = true;
			let textContent;

			if ( ( 5 !== state.currColIdx ) || ( !isWordValid( word ) ) ) {
				isPass = false; 

				if ( 5 !== state.currColIdx ) {
					textContent = 'Not enough letters';
				} else if ( !isWordValid( word ) ) {
					textContent = 'Not in word list';
				}
			}

			if ( !isPass ) {
				drawToast( textContent );

				row.classList.add( 'invalid' );
				setTimeout( () => {
					row.classList.remove( 'invalid' );
				}, state.animation_duration );
				
				return;
			}

			revealWord( state.isWinner, state.currRowIdx, word );

			state.currRowIdx++;
			state.currColIdx = 0;

			ls.setItem( 'snapshot', JSON.stringify( state ) );
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

function getCurrWord() {
	return state.grid[state.currRowIdx].reduce( ( prev, curr ) => prev + curr );
}

function isWordValid( word ) {
	return dictionary.includes( word );
}

function revealWord( isWinner, rowIdx, guess, animation_duration = state.animation_duration ) {
	let cardClass;

	isInputable = false;

	console.log( isWinner );

	const row = document.getElementById( `row${rowIdx}` );

	row.lastChild.addEventListener( 'animationend', ( e ) => {
		isInputable = true;

		if ( !e.target.classList.contains( 'win' ) ) {
			drawFinish( isWinner, rowIdx );
		}
	} );

	for ( let i = 0; i < boardLength.wordLen; i++ ) {
		const card = document.getElementById( `card${rowIdx}${i}` );
		const letter = card.textContent;

		setTimeout( () => {
			if ( state.secret[i] === letter ) {
				cardClass = 'correct';
			} else if ( state.secret.includes( letter ) ) {
				cardClass = 'present';
			} else {
				cardClass = 'absent';
			}

			card.setAttribute( 'data-state', cardClass );
		}, ( ( i + 1 ) * animation_duration ) / 2 );

		card.classList.add( 'flipped' );
		card.style.animationDelay = `${ ( i * animation_duration ) / 2 }ms`;
	}

	state.isWinner = ( state.secret === guess );
	state.winRowIdx = ( state.isWinner ) ? ( state.currRowIdx - 1 ) : 0;
	state.isGameOver = ( ( boardLength.maxRowLen - 1 ) === state.currRowIdx );
}

function drawFinish( isWinner, winRowIdx ) {
	let textFin;

	console.log( isWinner );
	console.log( winRowIdx );

	if ( state.isWinner ) {
		const winRow = document.getElementById( `row${winRowIdx}` );

		winRow.childNodes.forEach( ( e ) => {
			e.classList.remove( 'flipped' );
			e.classList.add( 'win' );
		} );

		textFin = 'Congratulations!';
	} else if ( state.isGameOver ) {
		textFin = `Better luck next time! The word was ${state.secret}.`;
	}

	if ( state.isWinner || state.isGameOver ) {
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
