var GLOBAL_lmstype = "";
var GLOBAL_dest = "";
var GLOBAL_defaultused = false;
var GLOBAL_pearson = false;

onload = function() {

	localize();

	// keep awake
	chrome.power.requestKeepAwake('display');

	var LdbAssist = null;
	var m_instanceID = null;
	var m_sessionKey = null;
	var m_bypass_mode = false;

	  

	// set the version number
	var manifest = chrome.runtime.getManifest();
	$(".version-number").text(manifest.version);

	
	$("#main_header_text").show();
	
	var listener = document.getElementById('listener');

	listener.addEventListener('load', moduleDidLoad, true);
	listener.addEventListener('message', handleMessage, true);

	// enable popovers
	$('[data-toggle="popover"]').popover({trigger: "manual", placement: "top"}); 
		
	
}

function localize() {
	$('.i8').each(function(index, element) {
		var intext = $(this).data("string");
		console.log("FFFFFFFFFFFFF  " + intext + "," + chrome.i18n.getMessage("@@ui_locale"));
		element.innerHTML = chrome.i18n.getMessage(intext);
	});
}

function networkTest() {
	var timeout = 3000;

	getUserPrefs();

	/*

	var xhr = new XMLHttpRequest();
 	var sessionbase = 'https://smc-service-cloud.respondus2.com/test.shtml';

 	xhr.open("POST", sessionbase, true);
	xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

	var timer = setTimeout( function() {nonetworkError();}, timeout);

	xhr.onreadystatechange = function() {
	  if (xhr.readyState == 4) {
	  	if (xhr.status == 200) {
	  		// success
	  		clearTimeout(timer);
	  		getUserPrefs();
	  		

		  } else {
		  	$("#errortext").show();
		  	$("#errorinfo").text('Status ' + xhr.status + ': init failed: ' + xhr.responseText);
		  }
		} else {
			// state is changing reset timer
			clearTimeout(timer);
			timer = setTimeout( function() {nonetworkError();}, timeout);
			
		}
	}
	
	xhr.send();
	*/

}

function nonetworkError() {
	console.log("TIMER EXPIRED NO NETWORK");

	$("#errortext").show();
	$("#errorinfo").text('Cannot detect any access to the internet. ');
}


function moduleDidLoad() {

	$("#messagetext").text("Module loaded...");

	LdbAssist = document.getElementById('ldb_assist');

	networkTest();	
	
}

function handleMessage(message_event) {

	$("#messagetext").text("Handling message...");

	console.log("Handling message: " + message_event.data);

  	var inmessage = message_event.data;  	

  	var m1 = inmessage.indexOf("sessionKey::");
  	var m2 = inmessage.indexOf("setup::");
  	var m3 = inmessage.indexOf("urlget::");

  	if (m1 != -1) {
  		$("#messagetext").text("Handling message...sessionkey");
  		getSessionKey(inmessage.substr(m1+12));
  		$("#messagetext").text("Handling message...sessionkey DONE");
  	} else if (m2 != -1) {
  		$("#messagetext").text("Handling message...institution");
  		var param = inmessage.substr(m2+7);  		
  		$("#messagetext").text("Handling message...institution DONE");
  		
  		moveForward();
  	} else if (m3 != -1) {
  		$("#messagetext").text("Handling message...urlstorage");
  		var param = inmessage.substr(m2+9);
  		$("#messagetext").text("Handling message...urlstorage DONE");

  		getURLStorage(param);
  	}


}

function getSessionKey(parameters) {
	moveForward(GLOBAL_lmstype);
}

function getSessionKeyOld(parameters) {

	$("#messagetext").text("Getting session key...");
	console.log(getSessionKey);

 	var xhr = new XMLHttpRequest();
 	var sessionbase = 'https://smc-service-cloud.respondus2.com/MONServer/chromebook/init.do';

 	var callhttp = sessionbase;

	xhr.open("POST", callhttp, true);
	xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

	xhr.onreadystatechange = function() {
	  if (xhr.readyState == 4) {
	  	if (xhr.status == 200) {

		    m_sessionKey = xhr.responseText;

		    $("#messagetext").text("Got session key...");

		    console.log("GOT session key: " + m_sessionKey);


		    LdbAssist.postMessage('setup::' + m_instanceID + "::" + xhr.responseText);

		    if (m_bypass_mode) {
		    	m_bypass_mode = false;
		    	moveForward(GLOBAL_lmstype);
		    	
		    } else {

		    	if (GLOBAL_pearson == false) {

			    	$("#entrytext").show();
			    	$("#institutionSearch").show();
			    	$("#institutionSearch").focus();
			    } 
		    }

		  } else {
		  	$("#errortext").show();
		  	$("#errorinfo").innerHtml = 'Status ' + xhr.status + ': init failed: ' + xhr.responseText;
		  }
		} else {
			$("#messagetext").text("Session key state: " + xhr.readyState);
		}
	}
	
	xhr.send(parameters);
}



function getURLStorage(parameters) {


 	var xhr = new XMLHttpRequest();
 	var sessionbase = 'https://smc-service-cloud.respondus2.com/MONServer/chromebook/profile.do';

 	var callhttp = sessionbase;

	xhr.open("POST", callhttp, true);
	xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xhr.onreadystatechange = function() {
	  if (xhr.readyState == 4) {

	  	if (xhr.status == 200) {

	  		// clear messaging
	  		$("#messagetext").text("");

	    	var urllist = JSON.parse(xhr.responseText);

	    	// store the results
	    	chrome.storage.local.set({'urllist': urllist}, function() {
	          // Notify that we saved.
	          

	          moveForward(urllist.lmsType);

	        });

			} else {
			  	$("#errortext").show();
			  	$("#errorinfo").innerHtml = 'Status ' + xhr.status + ': init failed: ' + xhr.responseText;
			}


	  }
	}
	xhr.send(parameters);
}


function setPearsonPrefs() {

	var home = "pearson_home.html";
	var homeURL = chrome.runtime.getURL(home);

	chrome.storage.local.set({'pearsonhome': homeURL}, function() {
		// move
		moveForward('PEARSONSDK');		
	});
}

function getPearsonPrefs() {
	chrome.storage.local.get('pearsonlist', function (obj) {                

        if (obj != null && obj.pearsonlist != null ) {
        	// already selected
        	moveForward('PEARSON');
        } else {
        	setPearsonPrefs();
        }
    });
}

function getUserPrefs() {

	$("#messagetext").text("Getting user prefs...");

	m_bypass_mode = false;

	chrome.storage.local.get('urllist', function (obj) {
                

        if (obj != null && obj.urllist != null && obj.urllist.startUrl != null ) {

        	m_bypass_mode = true;
        	GLOBAL_lmstype = obj.urllist.lmsType;

        	chrome.storage.local.get('profileid', function (profileobj) {
        		chrome.storage.local.get('institutioninfo', function (instituiontobj) {
        			console.log(instituiontobj);

        			if (typeof instituiontobj != 'undefined') {
	        			var institutioninfo = instituiontobj.institutioninfo;
	        			setSplash(institutioninfo.institutionid, institutioninfo.name, institutioninfo.profile, profileobj.profileid);
        			}
        		});
        			
        	});
        	
        } 

        getUserToken();
    });
}

function clearUserPrefs() {
	//chrome.storage.local.clear();
}

function moveForward(lmstype) {
	$("#messagetext").text("Starting moveforward");
	timer = setTimeout( function() {moveForwardNow(lmstype);}, 1000);
	//chrome.tabs.create({'url': dest});
}

function moveForwardNow(lmstype) {
	console.log("moveformward " + lmstype);

	$("#messagetext").text("Starting moveforwardNow");

	var dest = "collegeboard.html";

	m_sessionKey = 0;

	
	dest = dest + "?session_id=" + m_sessionKey;

	GLOBAL_dest = dest;

	console.log("moving forwardNOW..." + dest);

	$("#messagetext").text("Starting dest " + dest);

	var h = $(window).height();
	var w = $(window).width();


	$("#messagetext").text("Creating window " + dest);
	//chrome.app.window.create(dest, {bounds: {'width': w,'height': h}}, 
	chrome.app.window.create(dest, {state: "fullscreen", resizable: false, alwaysOnTop: true, focused: true},
	function(created_window) {

		console.log(created_window);

		$("#messagetext").text(chrome.runtime.lastError);

		$("#messagetext").text("Window created ");

		$("#messagetext").text("ERROR = " + chrome.runtime.lastError.message);

		created_window.contentWindow.document.addEventListener('keydown', function(e) {
	      e.preventDefault();
	    });
	    created_window.contentWindow.document.addEventListener('keyup', function(e) {
	      e.preventDefault();
	    });

		

		// show these for when the user returns
		if (GLOBAL_pearson == false) {
			$("#entrytext").show();
			$("#institutionSearch").show();
		    $("#institutionSearch").focus();
		    $("#cancellink").show();
		}
	});

	resetSplash();
}

function moveForwardOnCancel() {

	chrome.app.window.create(GLOBAL_dest, {state: "fullscreen"},
	function(created_window) {
		// show these for when the user returns
		$("#entrytext").show();
		$("#institutionSearch").show();
	    $("#institutionSearch").focus();
	    $("#cancellink").show();
	});

}

function setSplash(institutionid, institutionname, profilename, profileid) {
	console.log("setting timer");
	setTimeout(function() { setSplashActual(institutionid, institutionname, profilename, profileid); }, 6000);	
}

function setSplashActual (institutionid, institutionname, profilename, profileid) {
	console.log("timer done");
	$("#institutionSearch").val(institutionname);

	$("#institutionList option").remove();
	$("#institutionList").prop('size', 1);
	$("#institutionList").append($('<option></option>').val(institutionid).html(institutionname));

	$("#institutionList").show();

	if (profileid) {
		$("#profileList option").remove();
		$("#profileList").prop('size', 1);
		$("#profileList").append($('<option></option>').val(profileid).html(profilename));

		$("#profileList").show();
		
	}
	$('#saveButton').show();
}

function resetSplash() {

	// ticket 3399 do not clear choices
	//$('#institutionList').find('option').remove();
	//$('#institutionList').hide();
	//$('#profileList').find('option').remove();
	//$('#profileList').hide();
	//$('#saveButton').hide();
	//$("#institutionSearch").val('');
	$("#institutionSearch").val($('#institutionList option:selected').text());
	$("#institutionList option:not(:selected)").remove();
	$("#institutionList").prop('size', 1);

	$("#institutionList").prop('disabled', false);
	$("#profileList").prop('disabled', false);
	$("#institutionSearch").prop('disabled', false);
}



function getInstitutionList(parameters) {
	var xhr = new XMLHttpRequest();
 	var sessionbase = 'https://smc-service-cloud.respondus2.com/MONServer/chromebook/setup.do';

 	var callhttp = sessionbase; 	

 	$("#messagetext").text("Getting institution list...");

	xhr.open("POST", callhttp, true);
	xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

	xhr.onreadystatechange = function() {
	  if (xhr.readyState == 4) {

	  	if (xhr.status == 200) {

	  		$("#messagetext").text("Got institution list...");
	    		    
		    var resp = JSON.parse(xhr.responseText);
		    var institutionList = resp.institutions;
		    		    
		    var timer = null;		    
			var banned = ["university", "college", "school"]; // banned words

		    $("#institutionSearch").keyup(function(){

		    	$('#institutionSearch').removeClass("noresult");
		    	$('#institutionSearch').popover("hide");

			    if (timer != null) {
			    	clearTimeout(timer);			    	
			    } 

			    // hide the dropdowns
			    $('#institutionList').hide();
			    $('#profileList').hide();
			    $('#saveButton').hide();


			    // only set if >3 and not restricted			    
			    var t = $("#institutionSearch").val().toLowerCase().trim();
			    var len = t.length;

			    if (len > 2) {

			    	// remove banned words
			    	t = t.split('university').join('');
			    	t = t.split('universit').join('');
			    	t = t.split('universi').join('');
			    	t = t.split('univers').join('');
			    	t = t.split('univer').join('');
			    	t = t.split('unive').join('');
			    	t = t.split('univ').join('');
			    	t = t.split('uni').join('');

			    	t = t.split('niversity').join('');
			    	t = t.split('iversity').join('');
			    	t = t.split('versity').join('');
			    	t = t.split('ersity').join('');
			    	t = t.split('rsity').join('');
			    	t = t.split('sity').join('');
			    	t = t.split('ity').join('');

			    	t = t.split('college').join('');
			    	t = t.split('colleg').join('');
			    	t = t.split('colle').join('');
			    	t = t.split('coll').join('');
			    	t = t.split('col').join('');


			    	t = t.split('ollege').join('');
			    	t = t.split('llege').join('');
			    	t = t.split('lege').join('');
			    	t = t.split('ege').join('');

			    	t = t.split('school').join('');
			    	t = t.split('schoo').join('');
			    	t = t.split('scho').join('');
			    	t = t.split('sch').join('');

			    	t = t.split('chool').join('');
			    	t = t.split('hool').join('');
			    	t = t.split('ool').join('');


			    	timer = setTimeout( function() {performSearch(institutionList, t);}, 500);
			    }

			    

			    


			});

			$("#institutionList").change(function(){

				// hide the save and profule				
				$('#saveButton').hide();
				$('#profileList').hide();

			    // load the profiles
			    var selectid = $("#institutionList").val();			    

			    if (selectid != 'none') {

				    var pattern = new RegExp(selectid, 'i');
				    $.each(institutionList, function(i, v) {
				    	if (v.id.search(pattern) != -1) {

				    		var profileList = v.profiles;

				    		// only show if there is more than one				    					    			
			    			var sel = document.getElementById('profileList');
			    			$('#profileList').find('option').remove();


			    			var opt1 = document.createElement('option');
						    	opt1.innerHTML = "Select a server";
						    	opt1.value = "none";
						    	sel.appendChild(opt1);

			    			for (var i=0; i<profileList.length; i++) {
				    			var opt = document.createElement('option');
						    	opt.innerHTML = profileList[i].name;
						    	opt.value = profileList[i].id;
						    	sel.appendChild(opt);
					    	}

					    	if (profileList.length > 1) {
					    		$('#profileList').show();
						    	} else {
						    		// select the one profile
						    		$('#profileList option:nth-child(2)').attr('selected', 'selected');
						    		$('#saveButton').show();
						    	}
				    		
				    	}
				    });
				}
			});

			$("#profileList").change(function(){
		    	$('#saveButton').show();
		        });


		    $("#saveButton").unbind('click').bind('click', function (e) {
		    	
		    	e.stopPropagation();	
		    	e.preventDefault();
		    
		    	console.log("SAVE BUTTON");
		    	    	
		    	$("#institutionList").prop('disabled', true);
		    	$("#profileList").prop('disabled', true);
		    	$("#institutionSearch").prop('disabled', true);

		    	var institutionid = $("#institutionList").val();
		    	var institutiontext = $("#institutionList option:selected").text();
		    	var profiletext = $("#profileList option:selected").text();
		    	var selectid = $("#profileList").val();
		    	var messagekey = "urlget::" + m_instanceID + "::" + m_sessionKey + "::" + selectid;

		    	console.log(institutiontext);
		    	console.log(profiletext);

		    	// store the results
		    	chrome.storage.local.set({'profileid': selectid}, function() {

		    		var institutioninfo = {institutionid:institutionid, name:institutiontext, profile:profiletext};

		    		chrome.storage.local.set({'institutioninfo': institutioninfo}, function() {
		    			// Notify that we saved.
		          		LdbAssist.postMessage(messagekey);
		    		});
		          
		        });

		    });

		    $("#cancellink").click(function(){	
		    	moveForwardOnCancel();
		    });	 

		    // success remove text
		    $("#messagetext").text("");

		} else {
			$("#messagetext").text("ERR:institutionList incorrect readyState: " + xhr.readyState);
		}
	  } else {
	  	$("#messagetext").text("ERR:institutionList incorrect status: " + xhr.status);
	  }
	}
	xhr.send(parameters);
}

function performSearch(institutionList, searchPiece) {

	var match = 0;

	if (searchPiece.trim() != '') {

		$('#institutionList').find('option').remove();

		var sel = document.getElementById('institutionList');
		var pattern = new RegExp(searchPiece, 'i');

		//var opt1 = document.createElement('option');
	    //	opt1.innerHTML = "Select a institution...";
	   // 	opt1.value = "none";
	   // 	sel.appendChild(opt1);

		$.each(institutionList, function(i, v) {
			
	        if (v.name.search(pattern) != -1) {

		    	var opt = document.createElement('option');
		    	opt.innerHTML = v.name;
		    	opt.value = v.id;
		    	sel.appendChild(opt);

		    	match++;

	            return;
	        }
	    });

	    if (match > 0) {

	    	if (match > 6) {
	    		match = 6;
	    	}

	    	$('#institutionList').show();
	    	$('#institutionList').attr('size',match+1);
	    	$('#institutionList').focus();

	    	if ( match ==1 ) {
	    		// only one possible choice
	    		$('#institutionList').find('option:eq(0)').prop('selected', true).trigger('change');
	    		console.log("One choice....");
	    	}

	    } else {
	    	$('#institutionSearch').addClass("noresult");
	    	$('#institutionSearch').popover("show");
	    }
	    
	}
}


function getUserToken() {

	$("#messagetext").text("Getting user token..."); // new
	//var timeout = setTimeout( function() { defaultidused(); }, 1000*4);

	chrome.instanceID.getID( function (instanceID) {
			//clearTimeout(timeout);
			$("#messagetext").text("ID has returned..." + LdbAssist + "," + instanceID); // new

			if (GLOBAL_defaultused == false) {
				m_instanceID = instanceID;

				LdbAssist.postMessage('sessionKey::' + m_instanceID);

			$("#messagetext").text("Got id...");
		}
		
	});

	

}

function defaultidused () {
	$("#messagetext").text("Using default id...");
	GLOBAL_defaultused = true;
	m_instanceID = 'DEFAULT_1234567890';
	LdbAssist.postMessage('sessionKey::' + m_instanceID);
}

$("#pearson").click(function() {

	var dest = "http://portal.mypearson.com";

	chrome.storage.local.set({'pearsonlist': dest}, function() {
		moveForward('PEARSON');

	});

});

$("#mathxl").click(function() {

	var dest = "http://www.mathxlforschool.com/login_school.htm";
	// save the destination
	chrome.storage.local.set({'pearsonlist': dest}, function() {
		moveForward('PEARSON');

    });

});