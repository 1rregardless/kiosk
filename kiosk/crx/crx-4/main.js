/**
 * Listens for the app launching then creates the window
 *
 * @see http://developer.chrome.com/apps/app.runtime.html
 * @see http://developer.chrome.com/apps/app.window.html
 */
// chrome.app.runtime.onLaunched.addListener(function(launchData) {
//   // Center window on screen.
//   console.log("Printing the LaunchData", launchData);
//   var screenWidth = screen.availWidth;
//   var screenHeight = screen.availHeight;
//   var width = 1280;
//   var height = 1024;
// if(launchData && launchData.isKioskSession){
//   chrome.app.window.create('index.html', {
//     id: "helloWorldID",
//     'state': 'fullscreen',
//     'bounds': {
//                 'width': 1280,
//                 'height': 1024

//     },
//   });
// }
// else{
//   chrome.app.window.create('error.html', {
//     id: "error",
//     'state': 'fullscreen',
//     'bounds': {
//                 'width': 1280,
//                 'height': 1024

//     }
//   } 
// );
// }

// });
(function (window, chrome) {
    //Background Scope
    var background = {};
    window.background = background;

    //Create window and add listeners
    chrome.app.runtime.onLaunched.addListener(function (launchData) {
        if (launchData && launchData.isKioskSession) {
            chrome.app.window.create('index.html', {
                'state': 'fullscreen',
                'bounds': {
                    'width': 1280,
                    'height': 1024
                }
            });
        }
        else {
            chrome.app.window.create('index.html', {
                'state': 'fullscreen',
                'bounds': {
                    'width': 1280,
                    'height': 1024
                }
            })

        }

    });

    /**
     * Enables or disables the on-screen keyboard.
     * <p>
     * If enable is true, the virtual keyboard of the ChromeOS 
     * accessibility features will be enabled. If false, this function will 
     * return the setting to its original value.
     * @param {boolean} enable true to enable, or false to reset
     * @returns {undefined}
     */
    background.setKeyboard = function (enable) {
        if (chrome.accessibilityFeatures) {
            if (enable) {
                chrome.accessibilityFeatures.virtualKeyboard.set({
                    value: enable
                });
            }
            else {
                chrome.accessibilityFeatures.virtualKeyboard.clear({});
            }
        }
    };
})(window, chrome);