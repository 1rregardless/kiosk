// GLOBAL variables for state
var GLOBAL_tab_num = 0;
var GLOBAL_exam_start=false;
var GLOBAL_exam_complete = false;
var GLOBAL_tab_num=0;
var GLOBAL_max_tabs = 1;
var GLOBAL_count_tabs = 0;

var GLOBAL_rzifound = false;
var GLOBAL_setci = false;
var GLOBAL_setcv = false;
var GLOBAL_autolaunch = "";
var GLOBAL_setdomain = "";


var keys = {};

var WINKEY = "LOOKAWAY9812";

onload = function() {
			
		// protect the window
		window.onkeydown = window.onkeyup = function(e) { console.log("keydown detected - " + e.keyCode); if (e.keyCode == 27 /* ESC */) { e.preventDefault(); } };

		document.addEventListener('keydown', function (e) {
			console.log("document onkeydown listener " + e.which);
		});

		document.onkeydown = function(e) {
			console.log("document onkeydown " + e.which);
		}

		window.onresize = function() {
			console.log('been resized');
			maxWindow();
		}

		window.onfocus = function() {
			console.log("Lost focus");
			maxWindow();
			
			//chrome.app.window.create("warning.html", {id: WINKEY, state: "fullscreen"}, function(newwindow) {
			//	console.log(" focus warning sent");
			//});
		}

		window.onblur = function() {
			console.log("had a blur");
			maxWindow();

			chrome.app.window.create("warning.html", {id: WINKEY, state: "fullscreen", resizable: false, alwaysOnTop: true, focused: true, visibleOnAllWorkspaces: true, frame: "none"}, function(newwindow) {
				console.log("blur warning sent");
			});


		}

		//-----------------------------------------------------------------------------------------------------

		localize();

		

		function maxWindow() {
	        window.moveTo(0, 0);
	        top.window.resizeTo(screen.availWidth, screen.availHeight);

	        if (false) {
	            
	        }

	        else if (document.layers || document.getElementById) {
	            if (top.window.outerHeight < screen.availHeight || top.window.outerWidth < screen.availWidth) {
	                top.window.outerHeight = screen.availHeight;
	                top.window.outerWidth = screen.availWidth;
	            }
	        }
	    }



		//$("#overlay-debug").show();
		

		$('[data-toggle="popover"]').popover({trigger: "manual", placement: "left"});  

		// webviews need to be resized
		updateWebviews();

		// get the session id from splash
		m_session_id = getParam("session_id");

		// setup the native program
		var LdbAssist = null; 
		LdbAssist = document.getElementById('ldb_assist');

		// get a reference to the webview
        var webview = document.getElementById("main_webview");


        var blockesccode = 'window.onkeydown = window.onkeyup = function(e) { console.log("keydown detected - " + e.keyCode); if (e.keyCode == 27 /* ESC */) { e.preventDefault(); } };';
		webview.executeScript({ code: blockesccode, runAt: 'document_start' }, function() {						
			console.log("BLOCKING ESC ");		
		}); 


        // allow full screen video
        webview.addEventListener('permissionrequest', function(e) {
		  if (e.permission === 'fullscreen') {
		    e.request.allow();
		  }
		});


        


		var stopLoad = function(e) {
			var webview = document.getElementById("main_webview");
			webview.stop();

			webview.removeEventListener('loadstart', stopLoad);
		}

        // LISTENERS
        webview.addEventListener("loadstart", loadstartFT);
        webview.addEventListener("loadstop", loadstopFT);
        
        webview.addEventListener("loadcommit", loadcommitFT);
        webview.addEventListener('contentload', contentloadFT);	
        
        webview.addEventListener("loadredirect", loadredirectFT);
        webview.addEventListener("loadabort", loadabortFT);
        

        webview.addEventListener('consolemessage', function(e) {
  			console.log('Guest page logged a message: ', e.message);
		});


		webview.addEventListener('newwindow', function(e) {

			var webview = document.getElementById("main_webview");

			console.log('newwindow...............................' + webview.src + "," + e.targetUrl + "," + GLOBAL_exam_start);
									

			if (GLOBAL_exam_start == true) {

				var domain = extractDomain(webview.src);
				var newurl = e.targetUrl;
				
				console.log("NEW URL = " + newurl);
				
				var targetDomain = extractDomain(newurl);

				console.log("opening new tab............"+domain + "," + targetDomain);

				if (domain != targetDomain || newurl.indexOf("pdf") != -1) {

					if (valid_url(newurl) == true) {	
						console.log("newwindow");		
						opennewtab(newurl);
					}
					
				} else {
					webview.src = newurl;
				}

				
			} else {
				
				webview.src = e.targetUrl;		
				console.log("keeping new link in same window............");		
			}
			

		});

		var dialogController = null;
		webview.addEventListener('dialog', function(e) {

  			dialogController = e.dialog;

  			console.log("Dialog message: " + e.messageText);
  			

  			e.preventDefault();

  			if (e.messageText.indexOf('want to quit') != -1) {

  			
	  			$("#dialogTextSpan").text(e.messageText);  			
	  			$("#overlay-dialog").show();
	  			

	  			// button controllers
	  			$("#noDialogButtonDiv").click(function() { 					
					$("#overlay-dialog").hide();	
					dialogController.cancel();		
					e.preventDefault();
					dialogController = null;
									
				});

				$("#yesDialogButtonDiv").click(function() { 
					dialogController.ok();	
					e.preventDefault();						
					$("#overlay-dialog").hide();
					dialogController = null;

					
						endExam();
				});										
				

				
			} else {
					dialogController.ok();
			}
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
		    var tabContentId = $(this).parent().attr("data-target");	
		    
		    $(this).parent().parent().remove(); //remove li of tab
		    $(tabContentId).remove(); //remove respective tab content

		    $('#tablist a:last').click(); // Select another tab	    
		    		   		   
		    GLOBAL_count_tabs = GLOBAL_count_tabs - 1;

		    webview.addEventListener('loadstart', stopLoad);

		    //updateWebviews();
		});

		// Button management -------------------------------------------------------------

		$('#closewindowbutton').click(function() { 
			$('#closewindowbutton').popover("show");
			setTimeout(function() {$('#closewindowbutton').popover("hide");},3000);

		});

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

			window.close();
		 
		});

		$("#exitbutton").click(function() { 

			console.log("EXIT BUTTON");
			
			webview.go(-4);
			$("#overlay-div").hide();
			resetoverlay();
			unlockButtons();
			
		});

		$("#debug-exitbutton").click(function() { 						
			$("#overlay-debug").hide();
		});


}

function localize() {
	$('.i8').each(function(index, element) {
		var intext = $(this).data("string");		
		element.innerHTML = chrome.i18n.getMessage(intext);
	});

	// special action for close
	$("#closewindowbutton").data("content", chrome.i18n.getMessage("close_browser"));
}

function loadstartFT(e) {

	var webview = document.getElementById("main_webview");
	var newURL = e.url;	
	

	console.log('loadstart: ' + e.url + ' top? ' + e.isTopLevel );

	$('#debug-textarea').val($('#debug-textarea').val()+'loadstart: ' + e.url + ' top? ' + e.isTopLevel+'\n'); 

	
	if (newURL.indexOf("ldb1:jb") != -1) {
		$("#overlay-started-div").show();
		
		lockButtons();		
	}

	if (newURL.indexOf("rldbxb") != -1) {
		endExam();
	}

	if (newURL.indexOf("exit-weblock") != -1) {
		$("#overlay-complete-div").show();
		console.log("exit weblock");
	} 
	
}



function loadstopFT(e) {

	var webview = document.getElementById("main_webview");
	var newURL = e.url;	

	console.log('loadstopFT: ' + e.url + ' top? ' + e.isTopLevel);
	
}

function loadcommitFT(e) {

	var webview = document.getElementById("main_webview");
	var newURL = e.url;	
	var domain = extractDomain(newURL);

	// load char script
	webview.executeScript({ file: "js/injectkeys.js", runAt: 'document_end' }, function() {						
			
		}); 
	

	var cookval = docCookies.getItem("rldbcv");

	if (GLOBAL_setci == false || domain != GLOBAL_setdomain) {

		clearCookies(webview, domain);

		GLOBAL_setdomain = domain;
				
		var lcode = 'document.cookie="rldbci=1;path=/;domain=' + domain + '"';
		webview.executeScript({ code: lcode, runAt: 'document_start' }, function() {						
				
		}); 

		var lcode2 = 'document.cookie="rldbbdw=170822;path=/;domain=' + domain + '"';
		webview.executeScript({ code: lcode2, runAt: 'document_start' }, function() {						
				
		}); 

		var lcode3 = 'document.cookie="cbLDB=1;path=/;domain=' + domain + '"';
		webview.executeScript({ code: lcode3, runAt: 'document_start' }, function() {						
				
		}); 
			
		GLOBAL_setci = true;
	}


	if (GLOBAL_rzifound == true && GLOBAL_setcv == false) {

		console.log("LOOKING FOR AND SETTING RLDBCV..................");

		setResponse(newURL);

		} else {
			webview.executeScript({
		            code: 'var input = document.createElement("input");input.setAttribute("type", "hidden");input.setAttribute("name", "hidden_cookie");input.setAttribute("value", document.cookie);document.getElementsByTagName("head")[0].appendChild(input);',
		            runAt: 'document_start'  // and added this
		          });	

		webview.executeScript(
		    {code: 'document.head.innerHTML'},
			    function(results) {
			    if (results) {
			    		results = results.toString();
			    }
			    	
			    });
		}

	console.log('loadcommitFT: ' + e.url + ' top? ' + e.isTopLevel);
	
}

function setResponse(newurl) {
	var webview = document.getElementById("main_webview");
	var domain = extractDomain(newurl);

	console.log("setResponse " + newurl);

	webview.executeScript({
		            code: 'var input = document.createElement("input");input.setAttribute("type", "hidden");input.setAttribute("name", "hidden_cookie");input.setAttribute("value", document.cookie);document.getElementsByTagName("head")[0].appendChild(input);',
		            runAt: 'document_start'  // and added this
		          });	

    var pos  = newurl.indexOf("rldbcv=");
    if (pos != -1) {
    	// search in the URL
		findRLDBCV(newurl, webview, domain);
    } else {
    	// search for the cookie
		webview.executeScript(
		    {code: 'document.head.innerHTML'},
			    function(results) {

			    	if (results != null) {
			    		results = results.toString();
			    		findRLDBCV(results, webview, domain);
			    	}
			    	
			    }

			);
    }

    

    

	console.log("setResponse END..............");
}

function findRLDBCV(results, webview, domain) {
	
	var pos  = results.indexOf("rldbcv=");

 	if (pos != -1) {

	 	console.log("FOUND RLDBCV");

		 var end  = results.substring(pos+7);
		 
		 var pos2 = end.indexOf(";");
		 if (pos2 == -1) {
		 	// its the last one
		 	pos2 = end.indexOf("\"");
		 }

		 console.log("end = " + end);
		 var code = end.substring(0, 67);

		 console.log("code = " + code);
		 

		 var pos3 = code.indexOf("-");
		 var string1 = code.substring(0, pos3);
		 var index = code.substring(pos3+1, pos3+3);
		 var md51 = code.substring(pos3+3);

		 console.log("md51 = " + md51);

		 var s2 = "PSddhec68ma0i6Mr";

		 var answer = index + s2 + string1;
		 var answermd5 = hex_md5(answer);
		 var fullresponse = string1 + "-" + index + answermd5;

		 console.log("string1 = " + string1);

		 console.log("answer = " + answer + "," + answermd5);



		 
		 var lcode = 'document.cookie="rldbrv=' + fullresponse + ';path=/;domain=' + domain + '"';			 
		 					 						 
		 webview.executeScript({ code: lcode, runAt: 'document_end' }, function() {
			
				console.log('COOKIE rldbrv SET -------------------------------' + lcode);	
				$('#debug-textarea').val($('#debug-textarea').val()+'SETTING rldbrv COOKIE\n'); 

				if (chrome.runtime.lastError) {
					console.log("Failed to set rldbrv: " + chrome.runtime.lastError.message);
				} else {
					GLOBAL_setcv = true;									
				}
						
		});
		

	}
					
}

function loadredirectFT(e) {

	var webview = document.getElementById("main_webview");
	var newURL = e.url;	

	//$("#overlay-complete-div").show();

	console.log('loadredirectFT: ' + e.url + ' top? ' + e.isTopLevel);
	
}

function loadabortFT(e) {



	var webview = document.getElementById("main_webview");
	var newURL = e.url;	

	var secret1 = "IxwEYk2XfQ5gKaXf";
	var secret2 = "PSddhec68ma0i6Mr";

	
    
	var pos = newURL.indexOf("ldb1:jb");

	console.log("loadabort FT" + newURL);

	if (pos != -1) {

		console.log("loadabort FT" + GLOBAL_rzifound);

		GLOBAL_rzifound = true;

		

		var remainder = newURL.substring(pos+6);

		var pos1 = remainder.indexOf("\%7B");
  		var base64texta = remainder.substring(pos1+3);
  		var pos2 = base64texta.indexOf("\%7D");
  		var base64text = base64texta.substring(0, pos2);

  		var bf = new Blowfish(secret1, "ecb");

  		var plaintext = bf.decrypt(bf.base64Decode(base64text));

  		console.log("DECODED LINE");
  		console.log(plaintext);

		var u1 = plaintext.indexOf("<u>");
		var u2 = plaintext.indexOf("</u>");

		console.log(u1 + "," + u2);

		var newurl = plaintext.substring(u1+3, u2-u1+7);

		console.log("newurl = " + newurl);

		
		

		GLOBAL_autolaunch = newurl;

		

		webview = document.getElementById("main_webview");		

		webview.src = newurl;

		// wait and then hide the overlay
		setTimeout(function () {
	        $("#overlay-started-div").hide();
	    }, 3000);

		

	}
 
	console.log('loadabortFT: ' + e.url + ' top? ' + e.isTopLevel);
	
}

function contentloadFT(e) {

	var webview = document.getElementById("main_webview");
	var newURL = e.url;	

	console.log('contentloadFT: ' + e.url + ' top? ' + e.isTopLevel);


	
}


// ------------------------------ FUNCTIONS ----------------------------------------------------------------

function valid_url(url) {
	return true;
}

function resetoverlay() {

	$("#examPassword").val('');
	$("#passwordMessage").hide();
	
	$("#ldbMessage").hide();
	$("#cbMessage").hide();
	$("#monMessage").hide();
	$("#exiterrorButton").hide();		
}

function loadstart(e) {

	var webview = document.getElementById("main_webview");
	var newURL = e.url;	

	console.log('loadstart oncourse: ' + e.url + ' top? ' + e.isTopLevel);
	console.log('exam: ' + GLOBAL_exam_start);

	if (GLOBAL_exam_start == true && e.isTopLevel==true) {
		console.log("EXAM STARTED");
		var currentdomain = extractDomain(webview.src);
		var newdomain = extractDomain(newURL);

		console.log(currentdomain + "=" + newdomain);

			console.log("BLOCKING domain do not match");
			console.log("loadstart");
			webview.stop();
			
			opennewtab(newURL);
	}
	

	
	if (newURL.indexOf("finish") != -1) {
		console.log("finishing exam...");
		endExam();
	}
	
}



function findContent(e) {
	console.log('findrldbContent: ' + e.url + ' top? ' + e.isTopLevel + " reason: " + e.reason);

	$('#debug-textarea').val($('#debug-textarea').val()+'findrldbContent: ' + e.url + ' top? ' + e.isTopLevel + " reason: " + e.reason + "\n"); 


	var webview = document.getElementById("main_webview");


	if (e.url.indexOf("ldb1:jb") != -1) {
		
		webview.removeEventListener("loadabort", findrldbContent);
		GLOBAL_found_content = 1;

		GLOBAL_dataflow = e.url;

		// get the secrets
		getKeys();
	} else {
		//document.getElementById("ldb-launch-window").src
		webview.executeScript(
		    {code: 'document.getElementById("ldb-launch-window").src'},
			    function(results) {

			    	results = results.toString();

			    	//$('#debug-textarea').val($('#debug-textarea').val()+ "\n\n" + results + "\n\n"); 
			    	
			    	
			    	

			    	var pos = results.indexOf("ldb1:jb");

			    	if (pos != -1) {
			    		webview.removeEventListener("loadabort", findrldbContent);
			    		GLOBAL_found_content = 1;

			    		var ending = results.substring(pos);
			    		var pos2 = ending.indexOf("%7D");

			    		if (pos2 != -1) {
			    			var urlout = ending.substring(0, pos2+3);
			    			console.log("urlout= " + urlout);
			    			$('#debug-textarea').val($('#debug-textarea').val()+ "\n\n" + urlout + "\n\n"); 

			    			GLOBAL_dataflow = urlout;
			    			getKeys();
			    		}
			    	}
			    });
		
	}
	
}

function clearCookies(webview, domain) {

	console.log('clearing cookies');

	var lcode = 'document.cookie="rldbsi=;path=/;domain=' + domain + ';expires=Thu, 01 Jan 1970 00:00:00 GMT"';
	webview.executeScript({ code: lcode, runAt: 'document_start' });

	lcode = 'document.cookie="rldbcv=;path=/;domain=' + domain + ';expires=Thu, 01 Jan 1970 00:00:00 GMT"';
	webview.executeScript({ code: lcode, runAt: 'document_start' });

	lcode = 'document.cookie="rldbrv=;path=/;domain=' + domain + ';expires=Thu, 01 Jan 1970 00:00:00 GMT"';
	webview.executeScript({ code: lcode, runAt: 'document_start' });

	lcode = 'document.cookie="cbLDB=;path=/;domain=' + domain + ';expires=Thu, 01 Jan 1970 00:00:00 GMT"';
	webview.executeScript({ code: lcode, runAt: 'document_start' });


	lcode = 'document.cookie="rldbci=;path=/;domain=' + domain + ';expires=Thu, 01 Jan 1970 00:00:00 GMT"';
	webview.executeScript({ code: lcode, runAt: 'document_start' }, function() {
		

		webview.executeScript({
        code: 'var input = document.createElement("input");input.setAttribute("type", "hidden");input.setAttribute("name", "hidden_cookie");input.setAttribute("value", document.cookie);document.getElementsByTagName("head")[0].appendChild(input);',
        runAt: 'document_start'  // and added this
      });	

	});
}


var onetime = false;

function loadcommit(e) {
	console.log('loadcommit: ' + e.url + ' top? ' + e.isTopLevel);

	$('#debug-textarea').val($('#debug-textarea').val()+'loadcommit: ' + e.url + ' top? ' + e.isTopLevel + "\n"); 
	

	var newurl = e.url;
	var domain = extractDomain(newurl);

	var webview = document.getElementById("main_webview");

	if ((newurl.indexOf("course") != -1) && (newurl.indexOf("materials") != -1) ) {
		var coursepos = newurl.indexOf("course");
		var matpos = newurl.indexOf("materials");

		GLOBAL_course_id = newurl.substring(coursepos+7, matpos-1);

		console.log("COURSE ID = " + GLOBAL_course_id);
	}

	if ((newurl.indexOf("assignment") != -1) && (newurl.indexOf("assessment") != -1) ) {
		var assignpos = newurl.indexOf("assignment");
		var assesspos = newurl.indexOf("assessment");

		GLOBAL_exam_id = newurl.substring(assignpos+11, assesspos-1);

		console.log("EXAM ID = " + GLOBAL_exam_id);

		// clear the clipboard going into the exam
		var sandbox = document.getElementById('sandbox');
         sandbox.value = '';
         sandbox.select();
         if (document.execCommand('copy')) {
            console.log("SUCCESS");
         } else {
           console.log("FAIL");
         }


/*
		// put up overlay
		showLoadingMessage();

		// send message to helper to get exam information
		chrome.instanceID.getID( function (instanceID) {
				// get profile id
				chrome.storage.local.get('profileid', function (obj) {
			        

			        var profileid = obj.profileid;
			       
					var message = 'pass::' + instanceID + "::" + profileid + "::" + GLOBAL_course_id + "::" + GLOBAL_exam_id + "::" + m_session_id;
					
			        var LdbAssist = document.getElementById('ldb_assist');
					LdbAssist.postMessage(message);
			        
			    });
			});
			*/

	}


	if (newurl.indexOf("Dashboard") != -1 && !GLOBAL_found_content) {
		console.log("adding loadabort...");
		var webview = document.getElementById("main_webview");
		webview.addEventListener("loadabort", findrldbContent);				
	}

	if (newurl.indexOf("Dashboard") != -1) {
		clearCookies(webview, domain);

	}

	if (newurl.indexOf("ldb_step") != -1 && onetime == false) {

		onetime = true;

					var lcode = 'document.cookie="rldbci=1;path=/;domain=' + domain + '"';
					webview.executeScript({ code: lcode, runAt: 'document_start' }, function() {

						$('#debug-textarea').val($('#debug-textarea').val()+'SETTING rldbci COOKIE\n'); 
							console.log("SETTING rldbci COOKIE");		
				});

		
		
		webview.executeScript({
		            code: 'var input = document.createElement("input");input.setAttribute("type", "hidden");input.setAttribute("name", "hidden_cookie");input.setAttribute("value", document.cookie);document.getElementsByTagName("head")[0].appendChild(input);',
		            runAt: 'document_start'  // and added this
		          });	

		webview.executeScript(
		    {code: 'document.head.innerHTML'},
			    function(results) {

			    	results = results.toString();
				 
				 var pos  = results.indexOf("rldbcv=");

				 if (pos != -1) {

				 	

					 var end  = results.substring(pos+7);

					 console.log("end = " + end);

					 var pos2 = end.indexOf(";");
					 var code = end.substring(0, pos2);

					 console.log("code = " + code);

					 var pos3 = code.indexOf("-");
					 var string1 = code.substring(0, pos3);
					 var index = code.substring(pos3+1, pos3+3);
					 var md51 = code.substring(pos3+3);
					
					 var s2 = 'PSddhec68ma0i6Mr';
					 GLOBAL_s2 = "";

					 var answer = index + s2 + string1;
					 var answermd5 = hex_md5(answer);
					 var fullresponse = string1 + "-" + index + answermd5;

					 console.log(answermd5);


					 var lcode = 'document.cookie="rldbrv=' + fullresponse + ';path=/;domain=' + domain + '"';			 
					 webview.executeScript({ code: lcode, runAt: 'document_start' }, function() {
						
							console.log('COOKIE rldbrv SET -------------------------------' + lcode);	
							$('#debug-textarea').val($('#debug-textarea').val()+'SETTING rldbrv COOKIE\n'); 
														
											
					});
				} 

		    });
	}

		
	if (newurl.indexOf("prestart") != -1) {

		// put up overlay
		showLoadingMessage();

		// send message to helper to get exam information
		chrome.instanceID.getID( function (instanceID) {
				// get profile id
				chrome.storage.local.get('profileid', function (obj) {
			        

			        var profileid = obj.profileid;

			        // get exam id and course id
			        var x1 = GLOBAL_url.indexOf("<xi>");
					var x2 = GLOBAL_url.indexOf("</xi>");

					var examid = GLOBAL_url.substring(x1+4, x2);

					var c1 = GLOBAL_url.indexOf("<ci>");
					var c2 = GLOBAL_url.indexOf("</ci>");

					var courseid = GLOBAL_url.substring(c1+4, c2);

					var message = 'pass::' + instanceID + "::" + profileid + "::" + courseid + "::" + examid + "::" + m_session_id;

					console.log("MESSAGE " + message);

			        var LdbAssist = document.getElementById('ldb_assist');
					LdbAssist.postMessage(message);
			        
			    });
			});


		//add listener
		var webview = document.getElementById("main_webview");

	}

	if (newurl.indexOf("ldb") != -1 && newurl.indexOf("submit") != -1) {
		// remove tabs
		$('#tablist li:not(:first)').remove();		
	}

	

	
}

// function to look in frames
//@"{ function LDBLINKEX( doc ) { var s = ''; var links = document.getElementsByTagName('a');for ( var i = 0; i < links.length; i++ ) { if ( '_blank' == links[i].target ) { if ( links[i].href.indexOf('?') == -1 ) links[i].href = links[i].href + '?ldblt=' + encodeURIComponent( links[i].innerHTML ); else links[i].href = links[i].href + '&ldblt=' + encodeURIComponent( links[i].innerHTML ); links[i].target = ''; s = s + links[i].href + ' / '; } } return s}; function getFrames( frame, frameArray ) { frameArray.push( frame.frames ); for(var i = 0; i < frame.frames.length; i++){ getFrames(frame.frames[i], frameArray); }; return frameArray }; var allFrames = getFrames( window, new Array() ); for ( var i = 0; i < allFrames.length; i++) LDBLINKEX( allFrames[i].document ); }"

function moveForward() {

	// add script to run hidden function
	var webview = document.getElementById("main_webview");
	webview.executeScript({
		            code: 'var script = document.createElement("script");script.type = "text/javascript"; var text=document.createTextNode("rldb_prestart_finished();"); script.appendChild(text); document.head.appendChild(script);',
		            runAt: 'document_start'  // and added this
		          });	

    lockButtons();

	
}

function loadstop(e) {
	console.log('loadstop ');
}

function contentload(e) {
	console.log('contentload');
	var webview = document.getElementById("main_webview");

	var newurl = webview.src;

	// if the exam has started modify the links
	if (GLOBAL_exam_start == true) {
		
		console.log("EXAM ON...");

		

		webview.executeScript(
		    {code: 'var links = document.getElementsByTagName("a");var len = links.length;for(var i=0; i<len; i++){links[i].target = "_blank";}'},
			    function(results) {

			    	console.log(results + " Modified the links");
			    	
			    });

	}
}

function loadredirect(e) {
	console.log('loadredirect: ' + e.oldUrl + ' -> ' + e.newUrl + ' top? ' + e.isTopLevel);
}


        


function loadStartingPage() {

	var webview = document.getElementById("main_webview");
	
	
	//QA
	//webview.src = "https://op-apclassroom-content.collegeboard.org/login?directlogin=true";

	//PROD
 	webview.src = "https://myap.collegeboard.org";
	

/*
	chrome.storage.local.get('urllist', function (obj) {

		if (obj != null && obj.urllist != null && obj.urllist.startUrl != null ) {
			var webview = document.getElementById("main_webview");
			webview.src = obj.urllist.startUrl;			
		} 
	});
	*/
}


function opennewtab(url) {

	if (GLOBAL_count_tabs < GLOBAL_max_tabs) {
	
	  GLOBAL_count_tabs = GLOBAL_count_tabs + 1;
	  GLOBAL_tab_num = GLOBAL_tab_num + 1;
	  var ref = "add" + GLOBAL_tab_num;

	  console.log(">>>>> opening new tab: " + url);
	   
	  $("#tablist").append('<li><a data-toggle="tab" data-target="#' + ref + '"> Report' + ' <span></span></a></li>');

	  // add content
	  $("#tab-content").append('<div id="' + ref + '" class="tab-pane fade" data-url="' + url + '"><webview id="webview_' + ref + '" src="' + url + '"></webview></div>');
	  
	  updateWebviews();

	  // block all events in new webview
	  var newwebview = document.getElementById("webview_" + ref);

	  newwebview.addEventListener("loadstart", function(e) {
  			if (e.url != url) {
  				console.log("BLOCKING loadstart");
  				newwebview.stop();
  			}
  			
		 });

	  newwebview.addEventListener("loadcommit", function(e) {
  			if (e.url != url) {
  				console.log("BLOCKING loadcommit");
  				newwebview.stop();
  			}
		 });
	
	  newwebview.addEventListener("loadredirect", function(e) {
	  		if (e.newUrl != url) {
	  			console.log("BLOCKING loadredirect");
  				newwebview.stop();
  			}
		 });


		 // give the tab focus
		 $('#tablist a:last').click(); // Select another tab
		 $('#tablist a:first').click(); // Select another tab

		 //setTimeout(function() {var newwebview = document.getElementById("webview_add1");newwebview.reload();},3000);


	}
  
}



function lockButtons() {

	$('#button-cover').show();
	GLOBAL_exam_start = true;
	$(".tabbox-close").hide();
	
	
	// inject a block on clipboard
	var webview = document.getElementById("main_webview");
	webview.executeScript(
	    {code: 'var textArea = document.createElement("textarea");textArea.style.background = "transparent";textArea.value = " ";document.body.appendChild(textArea);textArea.select();document.execCommand("copy");document.body.removeChild(textArea);'},
		    function(results) {
		    	if (results != null) {
		    		resultsStr = results.toString();		
		    		console.log("COPY " + resultsStr);		
		    	}
		    	    	
		    }
		);
}

function unlockButtons() {
	// do not unlcck
	//$('#button-cover').hide();
	GLOBAL_exam_start = false;

	$(".tabbox-close").show();
	console.log("Turning EXAM OFF");
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
	chrome.storage.local.clear();
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

function endExam() {
	$("#overlay-complete-div").show();
	lockButtons();

	// remove tabs
	$('#tablist li:not(:first)').remove();

	clearCookies();
}

function handleMessage(message_event) {
	var webview = document.getElementById("main_webview");
	var myurl = webview.src;

//	var domain = extractDomain(myurl);

console.log('handleMessage = ' + message_event.data);

$('#debug-textarea').val($('#debug-textarea').val()+'handleMessage = ' + message_event.data + "\n"); 

	var incoming = message_event.data;

	var sep = incoming.indexOf("::");


	if (sep != -1) {
		var key = incoming.substring(0,sep);
		var remain = incoming.substring(sep+2);

		if (key == "alurl") {
			var inparam = remain;
			
			getSDKInfo(inparam);
		}

		if (key == "pass") {
			var sep2 = remain.indexOf("::");
			var parameters = remain.substring(0,sep2);			
			getExamInfo(parameters);
		}

	}
}

// -------------------------------------------------------------------

function getKeys(data) {
	chrome.instanceID.getID( function (instanceID) {

		var LdbAssist = document.getElementById('ldb_assist');

		console.log('alurl::' + instanceID + "::" + m_session_id);

		LdbAssist.postMessage('alurl::' + instanceID + "::" + m_session_id );

	});
}

function showErrorMessage(errorDiv) {
	$("#loadingMessage").text("The exam could not be loaded");
	$(errorDiv).show();
	$("#exiterrorButton").show();
}

function showLoadingMessage() {
	$("#loadingMessage").text("Loading Exam");
	$("#overlay-div").show();		
	
	console.log("Showing the loading div");	
}

function getExamInfo(parameters) {

console.log("GET EXAM INFO>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");

	var webview = document.getElementById("main_webview");

	var xhr = new XMLHttpRequest();

	var sessionbase = 'https://smc-service-cloud.respondus2.com/MONServer/chromebook/exam.do';

	var callhttp = sessionbase;

	xhr.open("POST", callhttp, true);
	xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	
	xhr.onreadystatechange = function() {
	  
	  if (xhr.readyState == 4) {


	  	if (xhr.status == 200) {

	  		var resp = JSON.parse(xhr.responseText);

	    	// check all the conditions are met
	    	if (resp.chromebook_enabled == 'false') {
	    		//$("#cbMessage").show();
	    		//$("#exiterrorButton").show();

	    		// REMOVE AFTER TESTING

	    		console.log("HIDING OVERLAY CHROMEBOOK ENABLED");

	    		$("#overlay-div").hide();
	    		moveForward();
	    		
	    	} else if (resp.ldb_enabled =='false') {
	    		showErrorMessage("#ldbMessage");	    		
	    	} else if (resp.monitor_enabled == 'true') {
	    		showErrorMessage("#monMessage");		    	
	    	} else {

	    		console.log("HIDING OVERLAY ELSE");
	    		// remove overlay
	    		$("#overlay-div").hide();

	    		// moveahead
	    		moveForward();
	    	}
	    	


	  	} else {

	  		$("#examMessage").show();
	    	$("#exiterrorButton").show();			
	  		
	  		console.log(xhr.responseText);
	  		console.log(parameters);

	  		//webview.go(-4);

	  		// remove overlay
	        //$("#overlay-div").hide();

	  		
	  	}

	  }
	}
	xhr.send(parameters);
		
}

function getSDKInfo(parameters) {
	var xhr = new XMLHttpRequest();
 			
	var sessionbase = 'https://smc-service-cloud.respondus2.com/MONServer/chromebook/sdk_info.do';

	console.log(sessionbase);

	xhr.open("POST", sessionbase, true);
	xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

	xhr.onreadystatechange = function() {
	  if (xhr.readyState == 4) {

	  	if (xhr.status == 200) {

	  		var pieces = JSON.parse(xhr.responseText);

			var ref = GLOBAL_dataflow;

			GLOBAL_s2 = pieces.secret2;
			

	  		var pos1 = ref.indexOf("\%7B");
	  		var base64texta = ref.substring(pos1+3);
	  		var pos2 = base64texta.indexOf("\%7D");
	  		var base64text = base64texta.substring(0, pos2);

	  		var bf = new Blowfish(pieces.secret1, "ecb");

	  		var plaintext = bf.decrypt(bf.base64Decode(base64text));

	  		GLOBAL_url = plaintext;

		  	console.log(plaintext);

			var u1 = plaintext.indexOf("<u>");
			var u2 = plaintext.indexOf("</u>");

			var newurl = plaintext.substring(u1+3, u2-u1+3);

			console.log("newurl = " + newurl);

			var webview = document.getElementById("main_webview");
			webview.src = newurl;

		} else {
			console.log("ERROR!! " + xhr.status + "," + xhr.responseText);
			$('#debug-textarea').val($('#debug-textarea').val() + 'error = ' + xhr.status + "," + xhr.responseText + "\n"); 
		}

	  }
	}
	
	xhr.send(parameters);
}

// HELPER FUNCTIONS ----------------------------------------------------------------

function getHostName(url) {
	var match = url.match(/:\/\/(www[0-9]?\.)?(.[^/:]+)/i);
    if (match != null && match.length > 2 && typeof match[2] === 'string' && match[2].length > 0) {
    	return match[2];
    } else {
        return null;
    }
}

function extractDomain(url) {
	var hostName = getHostName(url);
	var domain = hostName;
    
    if (hostName != null) {
        var parts = hostName.split('.').reverse();
        
        if (parts != null && parts.length > 1) {
            domain = parts[1] + '.' + parts[0];
                
            if (hostName.toLowerCase().indexOf('.co.uk') != -1 && parts.length > 2) {
              domain = parts[2] + '.' + domain;
            }
        }
    }
    
    
    return domain;

}