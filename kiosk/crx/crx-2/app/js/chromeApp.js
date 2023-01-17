"use strict";

var chromeApp = {
    webview: null,
    _initialized: false,
    settings: null,
    init: function () {
        var self = this;
        if (self._initialized) {
            return;
        }
        self._initialized = true;

        console.log("initialization");
        self.webview = document.getElementById('webview');

        self.blockChromeVoxShortcut();

        async.series([
            /*function (callback) {
                cpFinder.findPrimaryCP(false, function cpFinderCallback(cpDict){
		            
                    var cpDictKeys = Object.keys(cpDict);
                    var cpCount = cpDictKeys.length;
                    console.log('cpCount=',cpCount);
                    if(cpCount == 1) {
                        var cpInfoJson = cpDict[cpDictKeys[0]];		
                        var cpHost = url.parse(cpInfoJson.url).hostname;
                        console.log('cpHost:'+cpHost);
                    } else if(cpCount == 0) {		
                        console.log('no cp found');	
                    } else if(cpCount  > 0) {
                        console.log('more than one cp found');
                    }
                    callback(null, true);
                });
            },*/
            function (callback) {
                ChromeWVBridge.init(self.webview, function (res) {
                    res ? callback(null, res) : callback(res, null);
                });
            }

        ], function (err, results) {
            if (err) {
                console.log(err);
                return false;
            } else {
                self.webview.addEventListener("closeWindowRequest", function () {
                    console.log("Attempting to Close Windows");
                    CALDevice.exit();
                });

                webview.addEventListener('permissionrequest', function(e) {
                    if (e.permission === 'media') {
                      e.request.allow();
                    }
                });

                var manifest = chrome.runtime.getManifest();
                self.webview.setUserAgentOverride(navigator.userAgent + "/ETSChromeApcj/" + manifest.name + "(" + manifest.version + ")/" + APP_Settings.version);
                self.loadURL();
            }

        });

    },

    loadURL: function () {
        var self = this;
        self.webview.setZoom(1, function() {
            // do nothing
        });
        if (APP_Settings.local_app === true) {
            self.webview.src = "preapp/web/index.html";
        } else {
            self.webview.src = appConfig.LAUNCH_URL + appConfig.LAUNCH_CONTEXT;
        }
        console.log("loading webview with url " + self.webview.src);
    },

    blockChromeVoxShortcut: function () { // Block the ChromeVox enable/disable shortcut key combination Ctrl+Alt+Z
        var zKey = 90;
        document.body.onkeydown = function (e) {
            console.log('e.keyCode down = ' + e.keyCode);
            if (e.getModifierState('Control') && e.getModifierState('Alt') && e.keyCode === zKey) {
                console.log('blocking ctrl+alt+Z');
                e.preventDeefault();
                return false;
            }
        };
    }
};

$().ready(function () {
    chromeApp.init();
    jQuery(document).ready(function () {
        jQuery("#webview").css("width", "" + window.innerWidth + "px");
        jQuery("#webview").css("height", "" + window.innerHeight + "px");
        jQuery("#webview").css("position", "absolute");
        jQuery("#webview").css("left", "0px");
        jQuery("#webview").css("top", "0px");
        jQuery("#webview").css("padding", "0px");
        jQuery("#webview").css("margin", "0px");
    });
});
