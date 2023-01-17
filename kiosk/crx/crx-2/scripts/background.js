/*global $, jQuery, chrome, webview, CALPreferences */
/*jshint globalstrict: true*/
/**
 * The Main Loop/Setup
 */
var kioskMode;
kioskMode = false;

chrome.app.runtime.onLaunched.addListener(function (e) {
    var options = {
        'id': 'main window',
        'bounds': {
            'width': 1024,
            'height': 800
        }

    };

    /**
     * Variables access by the content scripts
     */
    kioskMode = e.isKioskSession;
    /**
     * For system check stuff
     */


    chrome.app.window.create('app/index.html', options, function(window) {
        window.fullscreen();
    });

    chrome.power.requestKeepAwake("display"); //Forces Power Saving off
});