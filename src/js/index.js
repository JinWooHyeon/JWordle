'use strict'

import { diagNewWordle, addHandlerDialog } from "./dialog.js";

console.log( '[Load index.js]' );

export const secret = {
	game: {
		grid: Array( 1 )
					.fill().map( () => Array( boardLength.wordLen ).fill( '' ) )
		, currRowIdx: 0
		, currColIdx: 0
	}
}

export let state = {
	game: {
		secret: 'secret'
		, grid: Array( boardLength.maxRowLen )
					.fill().map( () => Array( boardLength.wordLen ).fill( '' ) )
		, currRowIdx: 0
		, currColIdx: 0
		, isWinner: false
		, wonRowIdx: 0
		, isGameOver: false
		, isFin: false
		, isInputable: false
		, animation_duration: 500
		, timestamps: { firstPlayed: 0, lastPlayed: 0, lastCompleted: 0 }
	}
	, stats: {
		averageGuesses: 0
		, currentStreak: 0
		, gamesPlayed: 0
		, gamesWon: 0
		, guesses: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, fail: 0 }
		, hasPlayed: false
		, isOnStreak: false
		, maxStreak: 0
		, winRate: 0
	}
};
export const initState = _.cloneDeep( state );

let board;
let idxTimer;

export function resetState( keyName, value ) {
	state[keyName]= value;
}

document.addEventListener( 'DOMContentLoaded', () => {
	console.log( '[Start DOMContentLoaded]' );

	if ( ls.getItem( 'snapshot' ) ) {
		state = JSON.parse( ls.getItem( 'snapshot' ) );
	}

	document.querySelector( '.dateContainer .date' ).textContent = moment().format( 'ddd DD/MM/yyyy' );
	
	addHandlerStart();

	addHandlerKeyboard();
	addHandlerDialog( state );
} );

function addHandlerStart() {
	document.getElementById( 'startup' ).addEventListener( 'click', ( e ) => {
		e.preventDefault();
		
		console.log( '[Start JWordle]' );

		const contentWelcome = document.querySelector( '.contentWelcome' );
		
		if ( contentWelcome.classList.contains( 'active' ) ) {
			contentWelcome.classList.remove( 'active' );
			contentWelcome.classList.add( 'closing' );
		}

		if ( contentWelcome.animationend ) {
			contentWelcome.removeEventListener( 'animationend', contentWelcome.animationend );
		}

		contentWelcome.animationend = ( e ) => {
			e.preventDefault();

			contentWelcome.classList.remove( 'closing' );
			
			if ( !contentWelcome.classList.contains( 'active' ) ) {
				contentWelcome.style = 'display: none';
				contentWelcome.classList.remove( 'active' );
			}
		}

		contentWelcome.addEventListener( 'animationend', contentWelcome.animationend );

		initBoard();

		if ( 0 === state.game.timestamps.firstPlayed ) {
			state.game.timestamps.firstPlayed = Date.now();
			state.stats.hasPlayed = false;
	
			ls.setItem( state );

			setSecret();
		}

		if ( ( 0 !== state.game.timestamps.firstPlayed ) && ( 0 === state.game.timestamps.lastCompleted ) ) {
			idxTimer.start();
		} else {
			idxTimer.setPrevTime();
		}

		state.game.isInputable = true;
	} );
}

function setSecret() {
	let secret = location.search.replace( '?', '' );
	// let word = wordle.getWordle( secret );

	if ( '' === secret ) {
		secret = wordle.setWordle();
		// word = wordle.getWordle( secret );
	}

	state.game.secret = secret;
	// console.log( word );

	ls.setItem( state );
}

function initBoard() {
	board = new Board();

	board.drawGrid();
	board.setPrevWords();

	idxTimer = Timer( '#stopwatch', {
			startTime: state.game.timestamps.firstPlayed
			, endTime: state.game.timestamps.lastCompleted
		} );
}

const Board = function() {
	console.log( '[Load Board]' );
	
	this.drawGrid = function() {
		const board = document.getElementById( 'board' );
		let row;
	
		if ( 0 !== board.children.length ) {
			board.replaceChildren( '' );
		}
	
		for ( let i = 0; i < boardLength.maxRowLen; i++ ) {
			row = document.createElement( 'div' );
			row.id = `row${i}`;
			row.className = 'row';
	
			for ( let j = 0; j < boardLength.wordLen; j++ ) {
				this.drawCard( row, i, j );
			}
	
			board.appendChild( row );
		}
	}

	this.drawCard = function( container, row, col, letter = '' ) {
		const card = document.createElement( 'div' );
	
		card.className = 'card';
		card.id = `card${row}${col}`;
		card.textContent = letter;
		card.setAttribute( 'data-state', 'empty' );
	
		container.appendChild( card );
	}

	this.setPrevWords = function() {
		const currRowIdx = state.game.currRowIdx;
		let word;
	
		state.game.wonRowIdx = 0;
		state.game.isWinner = false;
		state.game.isGameOver = false;
		state.game.currRowIdx = 0;
	
		updateGrid();
	
		for ( let i = 0; i < currRowIdx; i++ ) {
			setTimeout( () => {
				word = getWord( i );
	
				revealWord( i, word, 200 );
			}, ( i * 100 ) );
		}
	}
}

function addHandlerKeyboard() {
	document.body.onkeydown = ( e ) => {
		const key = e.key;

		const contentWelcome = document.querySelector( '.contentWelcome' );

		if ( !state.game.isInputable ) {
			return;
		} else if ( !diagNewWordle.open && contentWelcome.classList.contains( 'active' ) ) {
			return;
		}

		if ( 'Enter' === key ) {
			if ( !state.game.isFin ) {
				state.game.isInputable = false;
			}

			const whichState = ( diagNewWordle.open ) ? secret : state;

			const word = getWord( whichState.game.currRowIdx );
			const row = document.getElementById( `row${whichState.game.currRowIdx}` );
			let textContent;

			if ( boardLength.wordLen !== whichState.game.currColIdx ) {
				textContent = 'Not enough letters';

				rejectWord( textContent, row );

				state.game.isInputable = true;

				return;
			}

			isWordValid( word )
				.then( ( resp ) => {
					if ( !diagNewWordle.open ) {
						revealWord( whichState.game.currRowIdx, word, whichState.game.animation_duration );
					} else {
						const url = `${location.origin}/?${wordle.setWordle( word )}`;

						diagNewWordle.querySelector( '#url' ).textContent = url;

						state.game.isInputable = true;
					}
				} )
				.catch( ( err ) => {
					textContent = 'Not in word list';

					rejectWord( textContent, row );

					state.game.isInputable = true;
				} );
		}

		if ( 'Backspace' === key ) {
			removeLetter();
		}

		if ( isLetter( key ) ) {
			addLetter( key.toLowerCase() );
		}

		updateGrid();
	}
}

function getWord( rowIdx ) {
	const whichState = ( diagNewWordle.open ) ? secret : state;

	// return whichState.game.grid[rowIdx].reduce( ( prev, curr ) => prev + curr );
	return whichState.game.grid[rowIdx].join( '' );
}

function isWordValid( word ) {
	if ( !diagNewWordle.open && state.game.isFin ) {
		return true;
	}

	return new Promise( ( resolve, reject ) => {
		Dictionary( word )
			.then( ( resp ) => {
				resolve( ( 0 !== resp.length ) );
			} )
			.catch( ( err ) => {
				reject( false );
			} );
	} );
}

function rejectWord( textContent, row ) {
	toast.showToast( 'warning', textContent );

	row.classList.add( 'invalid' );
	row.addEventListener( 'animationend', ( e ) => {
		row.classList.remove( 'invalid' );
	} );
}

function revealWord( rowIdx, guess, animation_duration ) {
	state.game.isInputable = false;

	updateRow( rowIdx, guess );

	flipRow( rowIdx, animation_duration );
}

function updateRow( rowIdx, guess ) {
	updateGameState( rowIdx, guess );

	const row = document.getElementById( `row${rowIdx}` );

	row.lastChild.addEventListener( 'animationend', ( e ) => {
		if ( !state.game.isFin ) {
			state.game.isInputable = true;
		}
		
		if ( !e.target.classList.contains( 'win' ) ) {
			if ( state.game.isWinner || state.game.isGameOver ) {
				drawFinish();
			}
		}
	} );
}

function updateGameState( rowIdx, guess ) {
	state.game.isWinner = ( wordle.getWordle( state.game.secret ) === guess );
	state.game.wonRowIdx = ( state.game.isWinner ) ? ( rowIdx ) : 0;
	state.game.isGameOver = ( ( boardLength.maxRowLen - 1 ) === rowIdx );

	if ( !state.game.isFin ) {
		state.game.timestamps.lastPlayed = Date.now();

		if ( state.game.isWinner || state.game.isGameOver ) {
			idxTimer.stop();

			state.game.isFin = true;
			state.game.timestamps.lastCompleted = state.game.timestamps.lastPlayed;
		}
	}

	state.game.currRowIdx++;
	state.game.currColIdx = 0;

	ls.setItem( state );
}

function flipRow( rowIdx, animation_duration ) {
	let dataState;

	// for ( let i = 0; i < boardLength ) {
	// 	for () {

	// 	}
	// }

	console.log( wordle.getWordle( state.game.secret ) );
	
	for ( let i = 0; i < boardLength.wordLen; i++ ) {
		const card = document.getElementById( `card${rowIdx}${i}` );
		const letter = card.textContent;

		setTimeout( () => {
			if ( wordle.getWordle( state.game.secret )[i] === letter ) {
				dataState = 'correct';
			} else if ( wordle.getWordle( state.game.secret ).includes( letter ) ) {
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

	if ( state.game.isWinner && !state.stats.hasPlayed ) {
		const winRow = document.getElementById( `row${state.game.wonRowIdx}` );

		winRow.childNodes.forEach( ( e ) => {
			const rowIdx = e.id.replace( `card${state.game.wonRowIdx}`, '' );

			e.style.animationDelay = `${ ( rowIdx * 100 ) }ms`;

			e.classList.remove( 'flipped' );
			e.classList.add( 'win' );
		} );

		textFin = 'Congratulations!';
	} else if ( state.game.isGameOver ) {
		textFin = `${state.game.secret}`;
	}

	if ( state.game.isWinner || state.game.isGameOver ) {
		if ( !state.stats.hasPlayed ) {
			state.game.isInputable = false;
			
			toast.showToast( '', textFin, 0 );

			updateStatsState();
		}

		document.getElementById( 'statistics-button' ).click();
	}
}

function updateStatsState() {
	const stats = state.stats;

	stats.hasPlayed = true;

	stats.gamesPlayed++;
	
	stats.gamesWon = ( state.game.isWinner ) ? ( stats.gamesWon + 1 ) : stats.gamesWon;
	stats.winRate = ( ( stats.gamesWon / stats.gamesPlayed ) * 100 ).toFixed( 2 );

	if ( state.game.isWinner ) {
		stats.guesses[( state.game.wonRowIdx + 1 )]++;
	} else if ( state.game.isGameOver ) {
		stats.guesses['fail']++;
	}

	stats.isOnStreak = state.game.isWinner;
	stats.currentStreak = ( stats.isOnStreak ) ? ( stats.currentStreak + 1 ) : 0;
	stats.maxStreak = ( stats.currentStreak > stats.maxStreak ) ? stats.currentStreak : stats.maxStreak;
	
	ls.setItem( state );
}

function removeLetter() {
	const whichState = ( diagNewWordle.open ) ? secret : state;

	if ( 0 === whichState.game.currColIdx ) {
		return;
	}
	
	whichState.game.currColIdx--;
	whichState.game.grid[ whichState.game.currRowIdx ][ ( whichState.game.currColIdx ) ] = '';

	setCardStatus( 'remove', whichState.game.currRowIdx, whichState.game.currColIdx );
}

function isLetter( key ) {
	return ( 1 === key.length ) && key.match( /[a-z]/i );	// /^[a-z]$/ : only lowercase
}

function addLetter( letter ) {
	const whichState = ( diagNewWordle.open ) ? secret : state;

	if ( boardLength.wordLen === whichState.game.currColIdx ) {
		return;
	}

	whichState.game.grid[ whichState.game.currRowIdx ][ whichState.game.currColIdx ] = letter;

	setCardStatus( 'add', whichState.game.currRowIdx, whichState.game.currColIdx );

	whichState.game.currColIdx++;
}

export function setCardStatus( status, row, col ) {
	const valAnimation = ( 'add' === status ) ? 'pop' : 'idle';
	const valState = ( 'add' === status ) ? 'tbd' : 'empty';

	const whichID = ( diagNewWordle.open ) ? 'secret' : 'card';

	const card = document.getElementById( `${whichID}${row}${col}` );
	card.setAttribute( 'data-animation', valAnimation );
	card.setAttribute( 'data-state', valState );

	setTimeout( () => {
		card.setAttribute( 'data-animation', 'idle' );
	}, ( state.game.animation_duration / 5 ) );
}

export function updateGrid() {
	const whichState = ( diagNewWordle.open ) ? secret : state;
	const maxRowLen = ( diagNewWordle.open ) ? 1 : boardLength.maxRowLen;
	const whichID = ( diagNewWordle.open ) ? 'secret' : 'card';

	for ( let i = 0; i < maxRowLen; i++ ) {
		for ( let j = 0; j < boardLength.wordLen; j++ ) {
			const card = document.getElementById( `${whichID}${i}${j}` );
			card.textContent = whichState.game.grid[i][j];
		}
	}
}
