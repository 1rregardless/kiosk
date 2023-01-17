onload = function() {

	// keep awake
	chrome.power.requestKeepAwake('display');

	// set the version number
	var manifest = chrome.runtime.getManifest();
	$(".version-number").text(manifest.version);

	updateWebviews();
	getPearsonPrefs();
	
}

function loadstart(e) {
	var webview = document.getElementById("sdk_webview");
	webview.stop();

	console.log("loadstart " + e.url);

	var dest = e.url;
	chrome.storage.local.set({'pearsonlist': dest}, function() {
		moveForwardNow('PEARSON');
    });

}

function loadstop(e) {
	// main page loaded now move on
	var webview = document.getElementById("sdk_webview");
	webview.addEventListener("loadstart", loadstart);
}

function getPearsonPrefs() {
	chrome.storage.local.get('pearsonhome', function (obj) {                

        if (obj != null && obj.pearsonhome != null ) {
        	var webview = document.getElementById("sdk_webview");
        	webview.src = obj.pearsonhome;

        	webview.addEventListener("loadstop", loadstop);
        	
        } else {
        	$("#overlay-select-dest").show();
        }
    });
}

function moveForwardNow(lmstype) {
	console.log("moveformward " + lmstype);
	var dest = "";

	if (lmstype == 'BLACKBOARD') {
		dest = "blackboard.html";
	} else if (lmstype == 'SCHOOLOGY') {
		dest = "schoology.html";
	} else if (lmstype == 'CANVAS') {
		dest = "canvas.html";
	} else if (lmstype == 'PEARSON') {
		dest = "pearson.html";
		m_sessionKey = 'PEARSON';
	}


	

	dest = dest + "?session_id=" + m_sessionKey;

	GLOBAL_dest = dest;

	console.log("moving forwardNOW..." + dest);

	var h = $(window).height();
	var w = $(window).width();

	//chrome.app.window.create(dest, {bounds: {'width': w,'height': h}}, 
	chrome.app.window.create(dest, {state: "fullscreen"},
	function(created_window) {
		window.close();
	});

}

function updateWebviews() {

  var list = document.getElementsByTagName("webview");

  var height = document.documentElement.clientHeight;
  var width  = document.documentElement.clientWidth;

  // remove the header height
  height = height - 100;
 		  
  for (var i=0; i < list.length; i++) {
  	var thiswebview = list[i];

  	thiswebview.style.width = width  + "px";	
  	thiswebview.style.height = height + "px";	   	
  }	


}



