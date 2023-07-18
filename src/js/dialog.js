'use strict'

import { secret, state, initState, resetState, setCardStatus, updateGrid } from "./index.js";

console.log( '[Load dialog.js]' );

let statsTimer;
export const diagNewWordle = document.getElementById( 'newWordle-dialog' );

export function addHandlerDialog() {
	addHandlerDialogNewWordle();
	addHandlerDialogStats();
	// addHandlerDialogSettings();
}

function addHandlerDialogNewWordle() {
	addButtonNewWordle( diagNewWordle );
	addButtonNewWordleClose( diagNewWordle );

	function addButtonNewWordle( diagNewWordle ) {
		const buttonContainer = document.querySelector( '.contentWelcomeContainer .buttonContainer' );
	
		const btnNewWordle = document.createElement( 'button' );
		btnNewWordle.id = 'New wordle';
		btnNewWordle.className = 'button secondary';
		btnNewWordle.textContent = 'New wordle';
	
		buttonContainer.prepend( btnNewWordle );
	
		btnNewWordle.onclick = ( e ) => {
			e.preventDefault();
	
			state.game.isInputable = true;
	
			diagNewWordle.style = 'display: flex';
			diagNewWordle.showModal();
	
			toast.removeToastAll();
		}
	}
	
	function addButtonNewWordleClose( diagNewWordle ) {
		diagNewWordle.querySelector( '.closeIcon' ).onclick = ( e ) => {
			e.preventDefault();
	
			state.game.isInputable = false;
			
			const content = diagNewWordle.querySelector( '.content' );
			content.classList.add( 'closing' );
	
			// Reset currRowIdx letters
			if ( 0 < secret.game.currColIdx ) {
				secret.game.currColIdx = 0;
	
				secret.game.grid[secret.game.currRowIdx] = Array( boardLength.wordLen ).fill( '' );
				
				for ( let i = 0; i < boardLength.wordLen; i++ ) {
					setCardStatus( 'remove', secret.game.currRowIdx, i );
				}
				
				updateGrid();
			}
	
			const urlcard = diagNewWordle.querySelector( '#url' );
			urlcard.textContent = '';
			urlcard.setAttribute( 'data-state', 'empty' );
	
			if ( content.animationend ) {
				content.removeEventListener( 'animationend', content.animationend );
			}
	
			content.animationend = ( e ) => {
				e.preventDefault();
	
				if ( content.classList.contains( 'closing' ) ) {
					diagNewWordle.close();
					diagNewWordle.style = 'display: none';
	
					content.classList.remove( 'closing' );
				}
			};
	
			content.addEventListener( 'animationend', content.animationend );
		};
	}
}

function addHandlerDialogStats() {
	const btnStatistics = document.getElementById( 'statistics-button' );
	const diagStatistics = document.getElementById( 'statistics-dialog' );

	addButtonMainMenu( diagStatistics );

	addButtonStatistics( btnStatistics, diagStatistics );
	addButtonStatisticsClose( diagStatistics );

	function addButtonMainMenu( diagStatistics ) {
		const btnMainMenu = document.createElement( 'button' );
		btnMainMenu.id = 'mainMenu';
		btnMainMenu.className = 'button';
		btnMainMenu.textContent = 'Main Menu';
	
		diagStatistics.querySelector( '.buttons.module .buttonContainer' ).append( btnMainMenu );
	
		btnMainMenu.onclick = ( e ) => {
			e.preventDefault();
	
			// Reset currRowIdx letters
			if ( 0 < state.game.currColIdx ) {
				state.game.currColIdx = 0;
	
				state.game.grid[state.game.currRowIdx] = Array( boardLength.wordLen ).fill( '' );
			}
	
			diagStatistics.querySelector( '.closeIcon' ).click();
	
			const contentWelcome = document.querySelector( '.contentWelcome' );
			contentWelcome.classList.add( 'active' );
			contentWelcome.style = 'display: block';
	
			toast.removeToastAll();
		}
	}
	
	function addButtonStatistics( btnStatistics, diagStatistics ) {
		btnStatistics.onclick = ( e ) => {
			e.preventDefault();
		
			state.game.isInputable = false;
		
			if ( state.game.isFin && state.stats.hasPlayed ) {
				addButtonNewGame( diagStatistics );
			} else {
				if ( null !== diagStatistics.querySelector( '.buttonContainer #newGame' ) ) {
					diagStatistics.querySelector( '.buttonContainer #newGame' ).remove();
				}
			}
		
			if ( !diagStatistics.open ) {
				const statistics = new Statistics( diagStatistics );
				statistics.setTime( '#playtime' );
		
				setDistribution( diagStatistics );
		
				diagStatistics.style = 'display: flex';
				diagStatistics.showModal();
			}
		};

		function addButtonNewGame( diagStatistics ) {
			const btnNewGame = document.createElement( 'button' );
			btnNewGame.id = 'newGame';
			btnNewGame.className = 'button';
			btnNewGame.textContent = 'New Game';
			
			if ( null === diagStatistics.querySelector( `.buttons.module .buttonContainer #${btnNewGame.id}` ) ) {
				diagStatistics.querySelector( '.buttons.module .buttonContainer' ).prepend( btnNewGame );
		
				btnNewGame.onclick = ( e ) => {
					e.preventDefault();
		
					const tmpState = _.cloneDeep( initState )
		
					resetState( 'game', tmpState.game );
					ls.setItem( state );
		
					diagStatistics.close();
					diagStatistics.style = 'display: none';
		
					document.getElementById( 'startup' ).click( e );
		
					toast.removeToastAll();
				};
			}
		}

		function Statistics( diagStatistics ) {
			const modStatistics = diagStatistics.querySelector( '.statistics.module' );
		
			this.setTime = ( elemID ) => {
				modStatistics.querySelector( elemID ).replaceChildren( '' );
				statsTimer = Timer( elemID, {
					startTime: state.game.timestamps.firstPlayed
					, endTime: state.game.timestamps.lastCompleted
					, format: 'HH:mm:ss'
				} );
			
				if ( 0 === state.game.timestamps.lastCompleted && 0 !== state.game.timestamps.firstPlayed ) {
					statsTimer.start();
				} else {
					statsTimer.setPrevTime();
				}
				statsTimer.setPrevTime();
			}
		
			modStatistics.querySelector( '#winPlayCnt' ).textContent = `${state.stats.gamesWon} / ${state.stats.gamesPlayed}`;
			modStatistics.querySelector( '#winRate' ).textContent = `${state.stats.winRate}%`;
		}

		function setDistribution( diagStatistics ) {
			const modDistribution = diagStatistics.querySelector( '.distribution.module' );
			const graphContainer = modDistribution.querySelector( '.graphContainer' ).cloneNode( true );
		
			modDistribution.replaceChildren( '' );
		
			let maxValue = 0;
		
			Object.keys( state.stats.guesses ).forEach( ( key ) => {
				maxValue = ( state.stats.guesses[key] > maxValue ) ? state.stats.guesses[key] : maxValue;
			} );
		
			Object.keys( state.stats.guesses ).forEach( ( key ) => {
				const newGraphContainer = graphContainer.cloneNode( true );
				const graphBar = newGraphContainer.querySelector( '.graphBar' )
				
				graphBar.classList.remove( 'highlight' );
				graphBar.classList.remove( 'alignRight' );
		
				if ( 0 < state.stats.guesses[key] ) {
					graphBar.classList.add( 'alignRight' );
				}
		
				if ( 0 === state.stats.guesses[key] ) {
					graphBar.style = 'width:7%';
				} else {
					graphBar.style = `width:${Math.round( state.stats.guesses[key] / maxValue * 100 )}%`;
				}
		
				if ( state.game.isFin ) {
					if (
						state.game.isWinner && ( ( parseInt( key ) - 1 ) === state.game.wonRowIdx )
						|| ( state.game.isGameOver && 'fail' === key )
					) {
						graphBar.classList.add( 'highlight' );
					}
				}
		
				newGraphContainer.querySelector( '.guess' ).textContent = key.substring( 0, 1 ).toUpperCase();
				newGraphContainer.querySelector( '.numGuesses' ).textContent = state.stats.guesses[key];
		
				modDistribution.appendChild( newGraphContainer );
			} );
		}
	}

	function addButtonStatisticsClose( diagStatistics ) {
		diagStatistics.querySelector( '.closeIcon' ).onclick = ( e ) => {
			e.preventDefault();
	
			const contentWelcome = document.querySelector( '.contentWelcome' );
	
			if ( !state.game.isFin && !contentWelcome.classList.contains( 'active' ) ) {
				state.game.isInputable = true;
			}
			
			const content = diagStatistics.querySelector( '.content' );
			content.classList.add( 'closing' );
	
			if ( content.animationend ) {
				content.removeEventListener( 'animationend', content.animationend );
			}
	
			content.animationend = ( e ) => {
				e.preventDefault();
	
				if ( content.classList.contains( 'closing' ) ) {
					diagStatistics.close();
					diagStatistics.style = 'display: none';
	
					content.classList.remove( 'closing' );
				}
			};
	
			content.addEventListener( 'animationend', content.animationend );
		};
	}
}

function addHandlerDialogSettings() {
	const btnSettings = document.getElementById( 'settings-button' );
	const diagSettings = document.getElementById( 'settings-dialog' );

	btnSettings.addEventListener( 'click', ( e ) => {
		state.game.isInputable = false;

		diagSettings.style = 'display: flex';
		diagSettings.showModal();
	} );

	diagSettings.querySelector( 'button' ).addEventListener( 'click', () => {
		state.game.isInputable = true;

		diagSettings.close();
		diagSettings.style = 'display: none';
	} );
}