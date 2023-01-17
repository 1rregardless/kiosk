window.onresize = doLayout;
var isLoading = false;
var isAbort = false;

onload = function() {
	var webview = document.querySelector('webview');
	webview.clearData({
		since : 0
	}, {
		appcache : true,
		cookies : true,
		fileSystems : true,
		indexedDB : true,
		localStorage : true,
		webSQL : true
	}, function() {
		// console.log('cleared cache');
	});

	var useragentversion = chrome.runtime.getManifest().version;
	useragentversion = parseFloat(useragentversion.match(/\d+\.\d+/)[0]);
	webview.setUserAgentOverride(webview.getUserAgent()+' TDE-ChromeAgent iPad'+'-v'+useragentversion);
	//webview.setUserAgentOverride(webview.getUserAgent()+ ' TDE-ChromeAgent iPad');
	webview.partition = guid();
	//console.log(webview.getUserAgent());
	doLayout();
	//console.log('after dolayout');

	document.querySelector('#save').onclick = function() {
		var status = document.querySelector('#status');
		status.textContent = '  ';
		var xhReq = new XMLHttpRequest();
		xhReq.onreadystatechange = function onSumResponse() {
			if (xhReq.readyState == 4) {
				if (xhReq.status==200) {
					saveHost(document.querySelector('#host').value);
				} else {
					status.innerHTML = '<span style="color: red">Not a valid TDE host.</span>';
				}
			}
		}
		var newUrl = document.querySelector('#host').value;
		if (newUrl.endsWithSkeet('/')) {
			newUrl = newUrl + 'media/ip/pltw/version.json';
		} else {
			newUrl = newUrl + '/media/ip/pltw/version.json';
		}
		//console.log(newUrl);
		//console.log(chrome.extension.getURL(newUrl));
		xhReq.open("GET", newUrl, true);
		xhReq.send(null);
		// saveHost(document.querySelector('#host').value);
	};

	document.querySelector('#reset').onclick = function() {
		saveHost();
	};

	webview.addEventListener('exit', handleExit);
	webview.addEventListener('loadstart', handleLoadStart);
	webview.addEventListener('loadstop', handleLoadStop);
	webview.addEventListener('loadabort', handleLoadAbort);
	webview.addEventListener('loadredirect', handleLoadRedirect);
	webview.addEventListener('loadcommit', handleLoadCommit);
	webview.addEventListener('permissionrequest', handlePermissionRequest); // to access microphone
};

String.prototype.endsWithSkeet = function(str) {
	var lastIndex = this.lastIndexOf(str);
	return (lastIndex != -1) && (lastIndex + str.length == this.length);
}

function guid() {
	function s4() {
		return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
	}
	return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4()
			+ s4() + s4();
}

// Saves options to chrome.storage
function saveHost(host) {
	if (!host || host == '' || host == 'undefined' || typeof host == 'undefined') {
		chrome.storage.sync.remove('kite.host', function() {
			// Update status to let user know options were saved.
			var status = document.querySelector('#status');
			status.textContent = 'Reset is successful.';
			setTimeout(function() {
				status.textContent = ' ';
			}, 750);
		});
	} else {
		chrome.storage.sync.set({
			'kite.host' : host
		}, function() {
			// Update status to let user know options were saved.
			var status = document.querySelector('#status');
			status.textContent = 'Host saved.';
			setTimeout(function() {
				status.textContent = '  ';
			}, 750);
		});
	}
	navigateTo();
}

function isNewVersionAvailable(appversion, chromeversion){
	let appArr = String(appversion).split(".");
	let chromeArr = String(chromeversion).split(".");
	let result = false;

	for(var i = 0; i<appArr.length && i<chromeArr.length;i++){
		if(appArr[i]<chromeArr[i]){
			result = true; 
			break;
		} else if (appArr[i]>chromeArr[i]) {
			result = false;
			break;
		}
		//if the values are equal check next set.
		//if the versions happen to be equal then no update is available 
		//return the default value false
	}	

 	return result;
 }


function navigateTo() {
	resetExitedState();
	chrome.storage.sync.get({'kite.host' : 'https://student-pltw.kiteaai.org/'},function(items) {
						// console.log('kite.host', items['kite.host']);
						document.querySelector('#host').value = items['kite.host'];
						//console.log(document.querySelector('#host').value);
						if (items['kite.host'].endsWithSkeet('/')) {
							document.querySelector('webview').src = items['kite.host']
									+ 'TDE/logIn.htm';
						} else {
							document.querySelector('webview').src = items['kite.host']
									+ '/TDE/logIn.htm';
						}
						var appversion = chrome.runtime.getManifest().version;
						appversion = parseFloat(appversion.match(/\d+\.\d+/)[0]);
						var checkHostValue = document.querySelector('#host').value;
						
						/*When LCS IP address is used as hostname, form the URL when we load to check the version number*/
						if (checkHostValue.endsWithSkeet('/')) {
							var newUrl = checkHostValue + 'media/ip/pltw/version.json';
						}else{
							var newUrl = checkHostValue + '/media/ip/pltw/version.json';
						}
						
						var xhReq = new XMLHttpRequest();
						xhReq.open("GET", newUrl, true);
						xhReq.onreadystatechange = function() {
							if (xhReq.readyState == 4) {
								//console.log('xhReq.responseText',xhReq.responseText);
								var chromeversion = JSON.parse(xhReq.responseText).chromeVersion;
								//checks if appversion < chromeversion
								if (isNewVersionAvailable(appversion, chromeversion)) {
									//console.log('Update Available');
									var webview = document.querySelector('webview');
									var controls = document.querySelector('#update');
									var controlsHeight = controls.offsetHeight;
									var windowWidth = document.documentElement.clientWidth;
									var windowHeight = document.documentElement.clientHeight;
									var webviewWidth = windowWidth;
									var webviewHeight = windowHeight - controlsHeight;

									webview.style.width = webviewWidth + 'px';
									webview.style.height = webviewHeight + 'px';
									controls.style.visibility = 'visible';
								}
							}
						}
						xhReq.send(null);
					});
}

function doLayout() {
	var webview = document.querySelector('webview');
	var controls = document.querySelector('#controls');
	var controlsHeight = controls.offsetHeight;
	var windowWidth = document.documentElement.clientWidth;
	var windowHeight = document.documentElement.clientHeight;
	var webviewWidth = windowWidth;
	var webviewHeight = windowHeight - controlsHeight;

	webview.style.width = webviewWidth + 'px';
	webview.style.height = webviewHeight + 'px';

	var sadWebview = document.querySelector('#sad-webview');
	sadWebview.style.width = webviewWidth + 'px';
	sadWebview.style.height = webviewHeight * 2 / 3 + 'px';
	sadWebview.style.paddingTop = webviewHeight / 3 + 'px';

	navigateTo();
}

function handleExit(event) {
	// console.log(event.type);
	document.body.classList.add('exited');
	if (event.type == 'abnormal') {
		document.body.classList.add('crashed');
	} else if (event.type == 'killed') {
		document.body.classList.add('killed');
	}
}

function resetExitedState() {
	if (!isAbort) {
		document.body.classList.remove('exited');
	}
	document.body.classList.remove('crashed');
	document.body.classList.remove('killed');
}

function handleLoadCommit(event) {
	// console.log('handleLoadCommit');
	resetExitedState();
	if (!event.isTopLevel) {
		return;
	}

	document.querySelector('#location').value = event.url;

	// var webview = document.querySelector('webview');
}

function handleLoadStart(event) {
	// console.log('handleLoadStart');
	document.querySelector('#tde-cp-host-settings').style.display = "none";
	document.body.classList.add('loading');
	isLoading = true;

	resetExitedState();
	if (!event.isTopLevel) {
		return;
	}

	document.querySelector('#location').value = event.url;
}

function handleLoadStop(event) {
	// We don't remove the loading class immediately, instead we let the
	// animation
	// finish, so that the spinner doesn't jerkily reset back to the 0 position.
	// console.log('handleLoadStop'+isAbort);

	var settingButton = document.querySelector('#tde-cp-host-settings');
	if (isAbort) {
		settingButton.style.display = "block";
	} else {
		var webview = document.querySelector('webview');
		var versionDisp = document.getElementById("versionDisplay");
		versionDisp.innerText = "Version : " + parseFloat(chrome.runtime.getManifest().version.match(/\d+\.\d+/)[0]);
		webview.executeScript({ code : "document.querySelector('#signinview') != null"}, function(result) {
			// console.log('result:'+result);
			if(result == 'true') {
				settingButton.style.display = "block";
			}
		});
	}
	isLoading = false;
	isAbort = false;
}

function handleLoadAbort(event) {
	isAbort = true;
	document.body.classList.add('exited');
//	console.log('loadAbort');
//	console.log('  url: ' + event.url);
//	console.log('  isTopLevel: ' + event.isTopLevel);
//	console.log('  type: ' + event.type);
}

function handleLoadRedirect(event) {
	//console.log('handleLoadRedirect');
	resetExitedState();
	if (!event.isTopLevel) {
		return;
	}

	document.querySelector('#location').value = event.newUrl;
}

function handleResponseHeaders(event) {
	//console.log('handleResponseHeaders');

}

function handlePermissionRequest(event){
	//console.log("event is",event);
	//console.log("event.permission is",event.permission);
	if (event.permission === 'media'){
		event.request.allow();
	}
}
