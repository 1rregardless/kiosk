"use strict";
var ChromeWVBridge = {
        handShakeTimer: null,
        shaked: false,
        _origin: null,
        _initialized: false,

        init: function(webview, cb) {
            var self = this;
            if (self._initialized) {
                cb(true);
                return;
            }
            self._initialized = true;
            //TODO: Why do we need both of these?
            //not positive we do
            chrome.runtime.onMessage.addListener(function(event) {

                self.onMessage(event);
            });
            var lastEvent = null;
            window.addEventListener("message", function(event) {
                lastEvent = event;
                self.onMessage(event);
            });


            //TODO: There is no way to have the webview emit a custom event here instead of using loadstop? That even then gets emitted in _ChromeOS._init() when settings up handshake.
            //No, chrome webview only has access to a limited number of DOM Events:
            //https://developer.chrome.com/apps/tags/webview#dom_events
            webview.addEventListener("loadstop", function() {
                if(!self.handShakeTimer) {
                    self.shaked = false;
                    self.handShakeTimer = setInterval(function() {

                        webview.contentWindow.postMessage({command: "handshake"}, "*");
                    }, 1000);
                }
            });
            if(cb) {
                cb(true);
            }
        },

        /**
         * Should be a JSON String
         * @param dataJ
         * @returns {*}
         */
        sendData: function(dataJ) {
            var self = this;

            if(!self.shaked) {
                return;
            }

            if(!dataJ.hasOwnProperty("dataJson")) {

            }
            if(typeof dataJ === "undefined" || dataJ == null || dataJ.length < 1) {

                return false;
            }

            (typeof dataJ === "object") ? dataJ = JSON.stringify(dataJ) : true;
            if(typeof dataJ === "object") {
                try {
                    dataJ = JSON.stringify(dataJ);
                } catch(e) {
                    console.log("error", e);
                }
            }
            try {
                var ev = "Event";
                if(dataJ.hasOwnProperty("crEvent")) {
                    ev = dataJ.crEvent;
                }

                //CALLogger.addToLog("SB", ev, dataJ);

                chromeApp.webview.contentWindow.postMessage(dataJ, "*");

            } catch(e) {

                console.log(e);

                return e;
            }
        }
        ,

        onMessage: function(event) {
            console.log('in onMessage in ChromeWVBridge: ' + event.data);
            var self = this, crEvent, dataJson, data;
            data = {};
            if(self.handShakeTimer) {
                clearTimeout(self.handShakeTimer);
                self.handShakeTimer = null;
                self.shaked = true;
            }
            if(event.data && event.data.hasOwnProperty("handShake")) {
                return;
            }
            (typeof event.data === "string") ? data = JSON.parse(event.data) : data = event.data;

            crEvent = data.crEvent;
            dataJson = data.dataJson;
            dataJson.crEvent = crEvent;
            $(self).triggerHandler(crEvent, [dataJson, function(ret) {
                var json = {'crEvent': crEvent, 'dataJson': ret};
                (ret.hasOwnProperty('id')) ? json.id = ret.id : null;
                (ret.hasOwnProperty('crEvent')) ? json.crEvent = ret.crEvent : null;
                if(data.hasOwnProperty('id')) {
                    json.id = data.id;
                }
                self.sendData(JSON.stringify(json));
            }]);
        }
    }
    ;