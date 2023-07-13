function addDialogEventListener( rcvState ) {
	const btnStatistics = document.getElementById( 'statistics-button' );
	const diagStatistics = document.getElementById( 'statistics-dialog' );

	btnStatistics.addEventListener( 'click', ( e ) => {
		rcvState.isInputable = false;

		diagStatistics.style = 'display: flex';
		diagStatistics.showModal();

		console.log( 'state.isInputable : ' + rcvState.isInputable );
	} );

	diagStatistics.querySelector( 'button' ).addEventListener( 'click', ( e ) => {
		rcvState.isInputable = true;

		diagStatistics.close();
		diagStatistics.style = 'display: none';
	} );

	const btnSetting = document.getElementById( 'settings-button' );
	const diagSetting = document.getElementById( 'settings-dialog' );

	btnSetting.addEventListener( 'click', ( e ) => {
		rcvState.isInputable = false;

		diagSetting.style = 'display: flex';
		diagSetting.showModal();
	} );

	diagSetting.querySelector( 'button' ).addEventListener( 'click', () => {
		rcvState.isInputable = true;

		diagSetting.close();
		diagSetting.style = 'display: none';
	} );

	btnStatistics.click();
}