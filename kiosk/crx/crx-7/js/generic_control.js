// GLOBAL variables for state
var GLOBAL_tab_num = 0;
var m_session_id = 0;

onload = function() {

		// webviews need to be resized
		updateWebviews();

		// get the session id from splash
		m_session_id = getParam("session_id");

		// setup the native program
		var LdbAssist = null; 
		LdbAssist = document.getElementById('ldb_assist');

		// get a reference to the webview
        var webview = document.getElementById("main_webview");

        // setup a set of global variables for info passing
        var GLOBAL_attempt_id = "";
        var GLOBAL_course_id = "";
        var GLOBAL_exam_complete = false;
        var GLOBAL_exam_start = false;

        // LISTENERS
        webview.addEventListener("loadstart", loadstart);

        webview.addEventListener('consolemessage', function(e) {
  			console.log('Guest page logged a message: ', e.message);
		});

		webview.addEventListener('newwindow', function(e) {
			console.log('newwindow');
		});

		// HANDLE COMMUNICATION WITH EXT PROGRAM
        var listener = document.getElementById('listener');        
        listener.addEventListener('message', handleMessage, true);

		

        // load up the saved start page
        loadStartingPage();





        // EVENT HANDLERS

        $(document).on('click','.tab-close',function(){
		    
		    // there are multiple elements which has .tab-close icon 
		    // so close the tab whose close icon is clicked
		    var tabContentId = $(this).parent().attr("href");		    

		    $(this).parent().parent().remove(); //remove li of tab
		    
		    $('#tablist a:last').tab('show'); // Select another tab

		    $(tabContentId).remove(); //remove respective tab content

		    //updateWebviews();
		});

		// Button management -------------------------------------------------------------

		$('#leftbutton').click(function() { 
			webview.back();
		});

		$('#rightbutton').click(function() { 
			webview.forward();
		});

		$('#stopbutton').click(function() { 
			webview.stop();
		});

		$('#reloadbutton').click(function() { 
			webview.reload();
		});

		$("#settingButton").click(function(){

		    chrome.storage.sync.clear( function() {
		    	var err = chrome.runtime.lastError;

		    	if (err === undefined ) {
		    		window.close();
		    	}
		    });

		    
		});


}

function loadstart(e) {

	console.log("load starting page");

	var webview = document.getElementById("main_webview");
	var newURL = e.url;	

	console.log('load: ' + e.url);
	
}
        


function loadStartingPage() {

	chrome.storage.sync.get('urllist', function (obj) {

		if (obj != null && obj.urllist != null && obj.urllist.startUrl != null ) {
			var webview = document.getElementById("main_webview");
			webview.src = obj.urllist.startUrl;			
		} 
	});
}


function opennewtab(url) {
	
  GLOBAL_tab_num = GLOBAL_tab_num + 1;
  var ref = "add" + GLOBAL_tab_num;
   
  $("#tablist").append('<li><a data-toggle="tab" href="#' + ref + '">Exam Content ' + GLOBAL_tab_num + ' <span class="close tab-close"> ×</span></a></li>');

  // add content
  $("#tab-content").append('<div id="' + url + '" class="tab-pane fade"><webview id="webview_' + ref + '" src="' + url + '></webview></div>');
  
  updateWebviews();
  
}


function lockButtons() {
	$('#button-cover').show();
}

function unlockButtons() {
	$('#button-cover').hide();
}

function getParam ( sname )
{
  var params = location.search.substr(location.search.indexOf("?")+1);
  var sval = "";
  params = params.split("&");
    // split param and value into individual pieces
    for (var i=0; i<params.length; i++)
       {
         temp = params[i].split("=");
         if ( [temp[0]] == sname ) { sval = temp[1]; }
       }
  return sval;
}

function clearUserPrefs() {
	chrome.storage.sync.clear();
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

function handleMessage(message_event) {
	var webview = document.getElementById("main_webview");
	var myurl = webview.src;

	var domain = extractDomain(myurl);

	var incoming = message_event.data;

	var sep = incoming.indexOf("::");

	if (sep != -1) {
		var key = incoming.substring(0,sep);
	}
}

// -------------------------------------------------------------------

function getKeys() {
	chrome.instanceID.getID( function (instanceID) {

		var LdbAssist = document.getElementById('ldb_assist');
		LdbAssist.postMessage('alurl::' + instanceID + "::" + m_session_id);

	});
}