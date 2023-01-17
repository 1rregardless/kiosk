'use strict';
window.onresize = updateViewSize;
window.onmessage = onReceiveMessage;
window.onkeydown = onWindowKeyEvent;
window.onkeyup = onWindowKeyEvent;
window.onload = onWindowLoaded;

let shiftKeyPressed, ctrlKeyPressed, altKeyPressed;
function onWindowKeyEvent(e) {
    shiftKeyPressed = e.shiftKey;
    ctrlKeyPressed = e.ctrlKey;
    altKeyPressed = e.altKey;
    if (shiftKeyPressed && ctrlKeyPressed && altKeyPressed && testingSiteWebView && (e.code === "KeyX")) {
        showControlBar("Do you want to exit to the sites selection menu?");
    }
}

const inputSystemInfo = window.systemInfo;
const systemInfo = {
    hostIdentification: "ChromeOS",
    hostVersion: window.systemInfo.manifest.version,
    isSecurelyHosted: window.systemInfo.launchData.isKioskSession
              //    || (window.systemInfo.instanceID === "cztvE2W-Tvg")  // Chrome extension MacBook
                  || (window.systemInfo.instanceID === "ej0fgu_Ztvg"), // Chrome extension Vlad @ Team Code
    hasSiteSelectionMenu: true,
    //macAddress: window.systemInfo.macAddress, // Deprecated
    deviceModel: window.systemInfo.cpuInfo.archName,
    processorType: window.systemInfo.cpuInfo.modelName,
    systemMemory: window.systemInfo.memoryInfo.capacity / (1024 * 1024),
    operatingSystem: fixOperatingSystemName(window.systemInfo.platformInfo.os),
    osVersion: getChromeVersion(),
    serialNumber: window.systemInfo.instanceID,
    isInsideSensitiveArea: false,
    isInStandByMode: false,
    stationIdentifiers: initStationIdentifiers(window.systemInfo)
};
function getChromeVersion() {
    const osVersionRegExp = /(?:Chrome\/)([0-9\.]+)/;
    const match = osVersionRegExp.exec(navigator.appVersion);
    return (match && (match.length > 1)) ? match[1] : null;
}
function fixOperatingSystemName(os) {
    //"mac", "win", "android", "cros", "linux", or "openbsd"
    return (os === "win") ? "Windows" : (os === "cros") ? "ChromeOS" : os;
}
function initStationIdentifiers(systemInfo) {
    const stationIdentifiers = [];
    /*** Don't use InstanceID becuse it is not persistent if user data is not persisted ***
    if (systemInfo.instanceID) {
        let serverGeneratedIdentifier = "", i, len = systemInfo.instanceID.length;
        for (i = 0; i < len; i++) serverGeneratedIdentifier += systemInfo.instanceID.charCodeAt(i).toString(16);
        stationIdentifiers.push({ type: "CHRUUID", identifier: serverGeneratedIdentifier.toUpperCase() });
    }*/
    if (isValidStationIdentifier(systemInfo.deviceID)) {
        stationIdentifiers.push({ type: "CHRUUID", identifier: systemInfo.deviceID.toUpperCase() });
    }
    if (systemInfo.macAddresses) {
        for (let address of systemInfo.macAddresses) {
            if (isValidStationIdentifier(address)) {
                stationIdentifiers.push({ type: "MACADDR", identifier: address });
            }
        }
    }
    else if (isValidStationIdentifier(systemInfo.macAddress)) {
        stationIdentifiers.push({ type: "MACADDR", identifier: systemInfo.macAddress });
    }
    return stationIdentifiers;
}

function isValidStationIdentifier(stationIdentifier) {
    return stationIdentifier && !(/^(([0 :-]+)|([fF :-]+))$/.test(stationIdentifier));
}

function loadGeneratedIdentifier(callback) {
    chrome.storage.local.get('SRVGENID', function (items) {
        const serverGeneratedIdentifier = (items && items.SRVGENID) ? items.SRVGENID : "";
        systemInfo.stationIdentifiers.unshift({ type: "SRVGENID", identifier: serverGeneratedIdentifier });
        callback();
    });
}
function saveGeneratedIdentifier(stationIdentifiers, callback) {
    let serverGeneratedIdentifier = "";
    for (let id of stationIdentifiers || []) {
        if ((id.type === "SRVGENID") && id.identifier) serverGeneratedIdentifier = id.identifier.trim().toUpperCase();
    }
    systemInfo.stationIdentifiers.find(function (x) { return x.type === "SRVGENID"; }).identifier = serverGeneratedIdentifier;
    chrome.storage.local.set({ 'SRVGENID': serverGeneratedIdentifier }, callback);
}

let testingSiteURL, testingSite, testingSiteWebView, saveTestingSiteURL;

function onWindowLoaded() {
    document.getElementById("versionNo").innerText = systemInfo.hostVersion;
    loadGeneratedIdentifier(function () {
        chrome.runtime.onUpdateAvailable.addListener(onUpdateRequiresRestart); // object details
        chrome.runtime.onRestartRequired.addListener(onUpdateRequiresRestart); // reason: "app_update", "os_update", or "periodic"

        if (systemInfo.isSecurelyHosted) {
            document.getElementById("appMenuButton").addEventListener('click', exitToSiteSelectionMenu);
            document.getElementById("closeControlBar").addEventListener('click', hideControlBar);
            document.getElementById("exitApplicationButton").addEventListener('click', exitTestingApplication);
            document.getElementById("retryGettingSites").addEventListener('click', exitToSiteSelectionMenu);
            loadTestSites(afterTestSitesInitialLoad);
            updateViewSize();
        }
        else {
            document.getElementById("exitApplicationButton").style.display = "none";
            document.getElementById("notInKioskView").style.display = "block";
            document.getElementById("linkToExtensions").addEventListener('click', onCopyTextToClipboardWhenClicked);
            const linkToAppicationId = document.getElementById("linkToAppicationId");
            linkToAppicationId.textContent = chrome.runtime.id;
            linkToAppicationId.addEventListener('click', onCopyTextToClipboardWhenClicked);
            showMainAppView();
        }
    });
}

function onCopyTextToClipboardWhenClicked(e) {
    e.preventDefault();
    const input = document.createElement('textarea');
    document.body.appendChild(input);
    input.value = e.target.textContent;
    input.focus();
    input.select();
    document.execCommand('Copy');
    input.remove();
}

function onUpdateRequiresRestart(reason) {
    systemInfo.isRestartRequired = true;
    checkUpdateRequiresRestart();
}
function checkUpdateRequiresRestart() {
    if (systemInfo.isRestartRequired && ((systemInfo.isInStandByMode && !systemInfo.isInsideSensitiveArea) || !testingSiteWebView)) {
        // to restart the chrome app use chrome.runtime.reload() or chrome.runtime.restart() in kiosk mode
        if (window.systemInfo.launchData.isKioskSession) chrome.runtime.restart(); else chrome.runtime.reload();
    }
}

function signalAutoUpdate() {
    console.log("signalAutoUpdate() - requestUpdateCheck");
    chrome.runtime.requestUpdateCheck(function (status, details) {
        console.log("Update check status: " + status + ", details: " + JSON.stringify(details));
    });
}

function afterTestSitesInitialLoad(sites, error) {
    chrome.storage.local.get('testingSiteURL', function (items) {
        console.log("shift:" + shiftKeyPressed + ", ctrl:" + ctrlKeyPressed + ", alt:" + altKeyPressed);
        if ((!shiftKeyPressed) && (!ctrlKeyPressed) && (!altKeyPressed)) {
            if (sites && sites.length && items && items.testingSiteURL) {
                for (let i = 0, n = sites.length; i < n; i++) {
                    if (sites[i] && sites[i].testsURL === items.testingSiteURL) {
                        // Automatically load saved site
                        startTestingApplication(items.testingSiteURL, false);
                        return;
                    }
                }
            }
            if (sites && sites.length === 1 && items && (!items.testingSiteURL)) {
                // Automatically load the only available site
                startTestingApplication(sites[0].testsURL, false);
                return;
            }
        }
        showMainAppView();
    });
}

function saveTestingSiteAutoLoadURL(testingSiteURL) {
    chrome.storage.local.set({ 'testingSiteURL': testingSiteURL }, function () {
        console.log('Auto starting testing site: ' + testingSiteURL + ' saved');
    });
}

function showControlBar(text) {
    document.getElementById("controlBarMessage").textContent = text;
    document.getElementById("controlBar").style.display = "block";
}
function hideControlBar() {
    document.getElementById("controlBar").style.display = "none";
}

function showMainAppView() {
    document.getElementById("mainApplicationView").style.display = "block";
    updateViewSize();
    hideControlBar();
    hideWebView();
}
function hideMainAppView() {
    document.getElementById("mainApplicationView").style.display = "none";
}

function showWebView(url, goDirectlyToTestSite) {
    if (!testingSiteWebView) {
        saveTestingSiteURL = goDirectlyToTestSite === true;
        testingSiteURL = url;
        testingSite = /[^:]+:\/\/[^\/]+/.exec(url)[0];
        testingSiteWebView = document.createElement("webview");
        document.body.appendChild(testingSiteWebView);
        testingSiteWebView.addEventListener('loadabort', onWebViewLoadAborts);
        testingSiteWebView.addEventListener('loadstop', onWebViewLoadStops);
        testingSiteWebView.addEventListener('unresponsive', onWebViewUnresponsive);
        testingSiteWebView.addEventListener('responsive', hideControlBar);
        testingSiteWebView.addEventListener('close', exitTestingApplication);
        testingSiteWebView.addEventListener('exit', exitToSiteSelectionMenu);
        updateSizeToFitClient(testingSiteWebView);
        systemInfo.isInsideSensitiveArea = systemInfo.isInStandByMode = false;
        testingSiteWebView.src = testingSiteURL;
        chrome.power.requestKeepAwake('display');
    }
    hideMainAppView();
}
function hideWebView() {
    if (testingSiteWebView) {
        document.body.removeChild(testingSiteWebView);
        testingSiteWebView = testingSiteURL = testingSite = undefined;
        chrome.power.releaseKeepAwake();
    }
}

function onWebViewUnresponsive() {
    showControlBar("Testing site has become unresponsive. Do you want to exit to the sites selection menu?");
}

function updateViewSize() {
    updateSizeToFitClient(testingSiteWebView || document.getElementById("mainApplicationView"));
}
function updateSizeToFitClient(view) {
    view.style.height = document.documentElement.clientHeight + "px";
    view.style.width = document.documentElement.clientWidth + "px";
}

let reasonOnWebViewLoadAborts;
function onWebViewLoadAborts(e) {
    e.preventDefault();
    reasonOnWebViewLoadAborts = e.reason;
}
function onWebViewLoadStops(e) {
    if (reasonOnWebViewLoadAborts) {
        // In case of loading site error
        showControlBar("Error loading testing site: " + reasonOnWebViewLoadAborts);
        reasonOnWebViewLoadAborts = undefined;
    }
    else if (e.target.src.toLowerCase().startsWith(testingSite.toLowerCase())) {
        // In case of successful load, when the site matches the start site, ...
        console.log("Sending the system info as the initial message to " + e.target.src);
        e.target.contentWindow.postMessage(systemInfo, testingSite);
    }
}

function onReceiveMessage(e) {
    console.log("Received message \"" + e.data + "\" from the testing site: " + e.origin);
    if (testingSite && (e.origin.toLowerCase() === testingSite.toLowerCase())) {
        const command = Array.isArray(e.data) ? e.data[0] : e.data;
        if (command === "initialized") {
            console.log("The test site received the initiazation message");
            if (saveTestingSiteURL) {
                saveTestingSiteAutoLoadURL(testingSiteURL);
                saveTestingSiteURL = false;
            }
        }
        else if (command === "resendSystemInfo") {
            console.log("Resending system info to " + e.target.src);
            e.source.postMessage(systemInfo, testingSite);
        }
        else if (command === "enterSensitiveArea") {
            systemInfo.isInsideSensitiveArea = true;
            console.log("Enter Sensitive Area");
        }
        else if (command === "exitSensitiveArea") {
            systemInfo.isInsideSensitiveArea = false;
            console.log("Exit Sensitive Area");
            checkUpdateRequiresRestart();
        }
        else if (command === "enterStandByMode") {
            systemInfo.isInStandByMode = true;
            console.log("Enter StandBy Mode");
            checkUpdateRequiresRestart();
        }
        else if (command === "exitStandByMode") {
            systemInfo.isInStandByMode = false;
            console.log("Exit StandBy Mode");
        }
        else if (command === "restartAplication") {
            restartTestingApplication(testingSiteURL);
        }
        else if (command === "exitToSiteSelectionMenu") {
            exitToSiteSelectionMenu();
        }
        else if (command === "exitApplication") {
            exitTestingApplication();
        }
        else if (command === "onRegisterStation") {
            saveGeneratedIdentifier(e.data[1], function () {
                console.log("Resending possible modified system info to " + e.target.src);
                e.source.postMessage(systemInfo, testingSite);
            });
        }
        else if (command === "signalAutoUpdate") {
            signalAutoUpdate();
        }
        else { console.log("Message data wasn't recognized: " + JSON.stringify(e.data)) + " (command: " + command + ")"; }
    }
    else { console.log("Message origin didn't matched the expected source: " + testingSite + ", data: " + JSON.stringify(e.data)); }
}

function onTestingSiteLinkButtonClicked(e) {
    e.preventDefault();
    const goDirectlyToTestSite = document.getElementById("goDirectlyToTestSite").checked;
    if (!goDirectlyToTestSite) saveTestingSiteAutoLoadURL(null);
    startTestingApplication(e.target.href, goDirectlyToTestSite);
}

function startTestingApplication(url, goDirectlyToTestSite) {
    console.log("Start testing application: " + url);
    showWebView(url, goDirectlyToTestSite);
}

function restartTestingApplication(url) {
    console.log("Restart testing application: " + url);
    hideWebView();
    showWebView(url);
}

function exitToSiteSelectionMenu() {
    console.log("Show site selection menu");
    loadTestSites(afterTestSitesReload);
}

function afterTestSitesReload(sites, error) {
    showMainAppView();
}

function exitTestingApplication() {
    console.log("Exit application");
    window.close();
}

function loadTestSites(callback) {
    getSitesFromServer(function (sites, error) {
        const testSitesList = document.getElementById("testSitesListContent");
        while (testSitesList.firstChild) { testSitesList.removeChild(testSitesList.firstChild); }
        let i = 0, n = 0;
        if (sites && sites.length) {
            for (n = sites.length; i < n; i++) {
                const site = sites[i];
                try {
                    if (site.testsURL) {
                        const link = document.createElement("a");
                        link.className = "siteSelectionButton";
                        link.textContent = (site.displayName) ? site.displayName : site.testsURL;
                        link.href = site.testsURL;
                        link.addEventListener('click', onTestingSiteLinkButtonClicked);
                        testSitesList.appendChild(link);
                    }
                    else break;
                }
                catch (err) { error = err.message; break; }
            }
        }
        if (error) {
            error = "Unable to get the testing sites list: " + error;
        }
        if ((!error) && (i < n)) {
            error = "Invalid testing sites configuration";
        }
        if ((!error) && (n === 0)) {
            error = "There are no testing sites available at this time";
        }
        const selectSiteView = document.getElementById("selectSiteView");
        const noSitesAvailable = document.getElementById("noSitesAvailable");
        if (error) {
            const errorGettingSites = document.getElementById("errorGettingSites");
            errorGettingSites.textContent = error;
            selectSiteView.style.display = "none";
            noSitesAvailable.style.display = "block";
        }
        else {
            selectSiteView.style.display = "block";
            noSitesAvailable.style.display = "none";
        }
        callback(sites, error);
    });
}

function getSitesFromServer(callback) {
    try {
        const xobj = new XMLHttpRequest();
        xobj.overrideMimeType("application/json");
        xobj.open('POST', 'https://ecasas.org/hosts/testsites.aspx', true);
        //xobj.open('POST', 'http://localhost:7779/Hosts/testsites.aspx', true);
        xobj.onreadystatechange = function () {
            if (xobj.readyState === XMLHttpRequest.DONE) {
                if (xobj.status === 200) {
                    try { callback(JSON.parse(xobj.responseText)); }
                    catch (err) { callback(null, err.message); }
                }
                else { callback(null, xobj.statusText); }
            }
        };
        xobj.setRequestHeader("Content-Type", "application/json");
        systemInfo.systemInfo = inputSystemInfo;
        xobj.send(JSON.stringify(systemInfo));
        delete systemInfo.systemInfo;
    }
    catch (err) { callback(null, err.message); }
}
