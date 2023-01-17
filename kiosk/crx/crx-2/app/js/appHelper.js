(function () {
    'use strict';

    var _inited = false;

    init();

    var callback = null;

    function init() {

        var apcjWksId;

        if (_inited) {
            return;
        }
        _inited = true;

        chrome.enterprise.deviceAttributes.getDeviceSerialNumber(function(serialNumber) {
            apcjWksId = "C:" + serialNumber; 
        });
        // chrome.enterprise.deviceAttributes does not work if you testing using unpacked extension in windows platform,
        // comment out above and uncomment below for testing in windows.
        //apcjWksId = "C:afehfalfhefe";

        fontLoader.init();

        $(ChromeWVBridge).on('wksinfo', function (crEvent, dataJson, cb) {
            callback = cb;
            vtool.registerCallback(cb);
            vtool.pushCheck("SystemCheck");
            var rtnValue = {
                wksinfo: {
                    gpoUrl: appConfig.LAUNCH_URL + "/ibt2tcweb/launch/launchfromwkssat",
                    uploadUrl: appConfig.LAUNCH_URL + "/ibt2tcweb/tdapp/rest/launchtest/pushsyscheckdata",
                    ucdResultsUploadUrl : appConfig.LAUNCH_URL + appConfig.ucdResultsUploadContext,
                    ucdSysUploadUrl : appConfig.LAUNCH_URL + appConfig.ucdSysUploadContext,
                    ucdVtoolRetrievalUrl : appConfig.LAUNCH_URL + appConfig.ucdVtoolRetrievalContext,
                    ucdVtoolPostUrl : appConfig.LAUNCH_URL + appConfig.ucdVtoolPostContext,
                    ucdWksId : apcjWksId,
                    wkstype: "ucd"
                }
            };
            cb(rtnValue);
        });

        $(ChromeWVBridge).on('shutdownwks', function (crEvent, dataJson, cb) {
            let results = vtool.getCheckResultsForAPCJ();
            if (results != null) {
                let rtnObj = {};
                rtnObj.action = "postReadinessCheck";
                rtnObj.data = results;
                rtnObj.data.sendConfirm = true;
                cb(rtnObj);
                // will wait for 5 secs if no response from web indicating that readiness check is posted
                setTimeout(function() {
                    checkManager.saveResults(function() {CALDevice.exit();});
                }, 5000);            
            } else {
                checkManager.saveResults(function() {CALDevice.exit();});
            }
        });

        $(ChromeWVBridge).on('readinessCheckPosted', function (crEvent, dataJson, cb) {
            checkManager.saveResults(function() {CALDevice.exit();});
        });

        $(ChromeWVBridge).on('minimizeBrowser', function (crEvent, dataJson, cb) {
            chrome.app.window.current().minimize();
        });

        $(ChromeWVBridge).on('doConfig', function (crEvent, dataJson, cb) {
            vtool.doConfig(dataJson["config"]);
        });


        $(ChromeWVBridge).on('doCheck', function (crEvent, dataJson, cb) {
            for (var i = 0; i < dataJson.checks.length; i++) {
                vtool.pushCheck(dataJson.checks[i]);
            }
        });

        $(ChromeWVBridge).on('defaultDevices', function (crEvent, dataJson, cb) {
            var rtnValue = { "action": "defaultDevices", "source": "WKS" };
            cb(rtnValue);
        });

        $(ChromeWVBridge).on('updateAndSaveOutputDevice', function (crEvent, dataJson, cb) {
            delete dataJson.crEvent;
            cb(dataJson);
        });

        $(ChromeWVBridge).on('updateAndSaveInputDevice', function (crEvent, dataJson, cb) {
            delete dataJson.crEvent;
            cb(dataJson);
        });

        $(ChromeWVBridge).on('saveResults', function (crEvent, dataJson, cb) {
            let results = vtool.getCheckResultsForAPCJ();
            if (results != null) {
                let rtnObj = {};
                rtnObj.action = "postReadinessCheck";
                rtnObj.data = results;
                cb(rtnObj);
            }
        });

        $(ChromeWVBridge).on('postResult', function (crEvent, dataJson, cb) {
            var rtnValue = JSON.parse(JSON.stringify(dataJson));
            delete rtnValue.result;
            delete rtnValue.crEvent;
            rtnValue.data = dataJson.result;
            vtool.postResult(dataJson.result);
            cb(rtnValue);
            vtool.runCheck(true);
        });

        $(ChromeWVBridge).on('zoom', function (crEvent, dataJson, cb) {
            chromeApp.webview.setZoom(dataJson.zoomFactor, function () {
                // do nothing
            });
        });

        $(ChromeWVBridge).on('appHelper.loadFont', function (crEvent, dataJson, cb) {
            var returnFont = fontLoader.getFontData(dataJson.fontName);
            //console.log("font data for " + dataJson.fontName + " : " + returnFont);
            cb({ fontName: dataJson.fontName, fontContent: returnFont });
        });

        $(ChromeWVBridge).on('getWorkstationDetail', function (crEvent, dataJson, cb) {
            let rtnValue = {};
            rtnValue.sysInfo = checkManager.getResult("SystemCheck");
            rtnValue.sysInfo.wksId = apcjWksId;
            chrome.system.network.getNetworkInterfaces(function(netInfo) {
                var ipaddress = "";
                for (var i = 0; i < netInfo.length; i++) {
                    if (!netInfo[i].name.startsWith("arc") && netInfo[i].prefixLength <= 30) {
                        rtnValue.sysInfo.wksipaddress = netInfo[i].address;
                        cb(rtnValue) 
                        break;          
                    }
                }
            });

        });

    }
})();
