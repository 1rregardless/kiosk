/**
 * Listens for the app launching then creates the window
 *
 * @see http://developer.chrome.com/trunk/apps/app.runtime.html
 * @see http://developer.chrome.com/trunk/apps/app.window.html
 */
chrome.app.runtime.onLaunched.addListener(function(launchData) {
  if (launchData.isKioskSession) {//we are in kiosk mode
    runApp();
  } else {
    chrome.app.window.create('nonkiosk.html', {
      'state' : 'maximized',
      'bounds' : {
        'width' : 1280,
        'height' : 1024
      }
    });
  }
});

/**
 * Creates the window for the application.
 *
 * @see http://developer.chrome.com/trunk/apps/app.window.html
 */
function runApp() {
	chrome.power.requestKeepAwake('display');
	chrome.app.window.create('browser.html', {
		'state' : 'fullscreen',
		'bounds' : {
			'width' : 1280,
			'height' : 1024
		}
	});
}