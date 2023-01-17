var GLOBAL_reload_review = false;
var GLOBAL_pass = "";
var GLOBAL_tab_num = 0;
var GLOBAL_domain = "";
var GLOBAL_max_tabs = 5;
var GLOBAL_count_tabs = 0;
var GLOBAL_content_URL ="";

onload = function() {

		// enable popovers
		$('[data-toggle="popover"]').popover({trigger: "manual", placement: "left"});   

		$(".tab").click(function (e) {

			// Bb seems to reload when the page is tabbed so prevent that from happening
			webview.addEventListener('loadstart', stopLoad);
		}

		);

		var stopLoad = function(e) {
			var webview = document.getElementById("main_webview");
			webview.stop();

			webview.removeEventListener('loadstart', stopLoad);
		}

		var webview = document.getElementById("main_webview");

		webview.addEventListener('contentload', function(e) {
			console.log('contentload webview...............................' + webview.src);
			GLOBAL_content_URL = webview.src;
		});
		webview.addEventListener('loadend', function(e) {
			console.log('loadend webview...............................');
		});
		webview.addEventListener('loadstop', function(e) {
			console.log('loadstop webview...............................');
		});

		// webviews need to be resized
		updateWebviews();

		// get the session id from splash
		var m_session_id = getParam("session_id");

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

        // load up the saved start page
        loadStartingPage();

        
        var loadstart = function(e) {
          
          var webview = document.getElementById("main_webview");

          console.log('load: ' + e.url + ", " + e.isTopLevel);
          
		  var newURL = e.url;	
		  var newDomain = extractDomain(newURL);


		  if (GLOBAL_domain == newDomain) {

			  var n = newURL.indexOf("launch.jsp");
			  var pass_n = newURL.indexOf("password");
			  var saveAttempt_n = newURL.indexOf("saveAttempt");
			  var submitted_n = newURL.indexOf("submitted.jsp");
			  var review_n = newURL.indexOf("review.jsp");
			  var contents_n = newURL.indexOf("listContent.jsp");
			  var launch_n = newURL.indexOf("launch.jsp");
			  


			  if (launch_n != -1) {
			  	
			  	//webview.addEventListener('loadstart', disableLinks);
			  }

			  if (saveAttempt_n != -1) {

			  	
			  	// on the page saveAttempt page
			  	GLOBAL_attempt_id = getParameterByName('attempt_id', newURL);
			  	GLOBAL_course_id = getParameterByName('course_id', newURL);

			  	$('#tablist li:not(:first)').remove();

			  	//webview.addEventListener('contentload', addReviewCookie);
			  }

			  if (review_n != -1) {

			  	// only the final review page...exam is done
			  	GLOBAL_attempt_id = getParameterByName('attempt_id', newURL);
			  	GLOBAL_course_id = getParameterByName('course_id', newURL);

			  	webview.removeEventListener('contentload', rerouteLinks) ;
				
			  	GLOBAL_exam_complete = true;
			  	unlockButtons();

			  	if (GLOBAL_reload_review == false) {
			  		webview.addEventListener('contentload', addReviewAttemptCookie);		  		

			  		$('#overlay-review-div').show();
			  	} else {
			  		GLOBAL_reload_review = false;
			  	}

			  	
			  }

			  if (contents_n != -1) {


			  	if (GLOBAL_exam_complete && GLOBAL_exam_start) {
			  	
			  		// show overlay
					endExam();
					

			  	}
			  }

			  if (submitted_n != -1) {
			  	// remove tabs
				$('#tablist li:not(:first)').remove();
			  	
			  }

				

				if (n != -1 && pass_n === -1) {

					// if the exam was already completed do not allow another exam
					if (GLOBAL_exam_complete == true) {
						// show overlay and end exam
						endExam();

					} else {

						webview.addEventListener('contentload', rerouteLinks) ;

						GLOBAL_exam_complete = false;
						GLOBAL_exam_start = true;

						$(".tabbox-close").hide();
								

						webview.addEventListener('contentload', insertPassword);

						// show overlay
						showLoadingMessage();
						lockButtons();
				}




				} else {
					
					webview.src = e.targetUrl;

					if (n != -1 && pass_n != -1) {
						webview.addEventListener('contentload', removeOnSubmit);
					}

					//webview.executeScript({ code: 'document.getElementById("steptitle1").innerHtml="AAAAAA"' });
				}	    

			} else {
				
				// its a link open in a tab if exam started
				if (GLOBAL_exam_start == true && e.isTopLevel) {

					// stop loading the new page
					e.preventDefault();
					webview.stop();					
					
					if (newURL != 'about:blank') {						
						opennewtab(newURL);
					}

					
				}


			}


        }

        var loadstop = function(e) {
          //NO-OP
        }

        // LISTENERS -------------------------------------------------------------------------

        webview.addEventListener("loadstart", loadstart);
        webview.addEventListener("loadstop", loadstop);

        webview.addEventListener('consolemessage', function(e) {
  			console.log('Guest page logged a message: ', e.message);
		});

		webview.addEventListener('loadcommit', function(e) {
  			console.log('LOADCOMMIT ' + e.url + ", " + e.isTopLevel);
		});

		webview.addEventListener('loadstart', function(e) {


  			if (e.url == GLOBAL_content_URL) {
  				console.log("Same URL blocking reload");
  				//webview.stop();
  			}

  			if (e.isTopLevel == false) {
  				console.log("not top blocking reload");
  				//webview.stop();
  			}
		});

		webview.addEventListener("dialog", openDialog); 

		$(document).on('click','.tab-close',function(){
					    
		    // there are multiple elements which has .tab-close icon 
		    // so close the tab whose close icon is clicked
		    var tabContentId = $(this).parent().attr("data-target");	
		    
		    $(this).parent().parent().remove(); //remove li of tab
		    $(tabContentId).remove(); //remove respective tab content

		    $('#tablist a:last').click(); // Select another tab	    
		    		   		   
		    GLOBAL_count_tabs = GLOBAL_count_tabs - 1;

		    webview.addEventListener('loadstart', stopLoad);

		    
		  		   
		});

		// LISTENERS END ---------------------------------------------------------------------

		function loadStartingPage() {
			chrome.storage.local.get('urllist', function (obj) {
        
        		if (obj != null && obj.urllist != null && obj.urllist.startUrl != null ) {

        			var url = obj.urllist.startUrl;
        			GLOBAL_domain = extractDomain(url);
        			
        			webview.src = url;
        		        			
        		} else {
        			console.log("ERROR URLLIST IS UNKNOWN");
        		}

        
    		});
		}

		function endExam() {
			$("#overlay-complete-div").show();
			lockButtons();

			// remove tabs
			$('#tablist li:not(:first)').remove();
		}

		// Button management -------------------------------------------------------------

		$('#closewindowbutton').click(function() { 
			$('#closewindowbutton').popover("show");
			setTimeout(function() {$('#closewindowbutton').popover("hide");},3000);
			console.log("CLOSE WINDOW CLICK");
		});


		$('#leftbutton').click(function() { 
			$(this).blur();
			webview.back();
		});

		$('#rightbutton').click(function() { 
			$(this).blur();
			webview.forward();
		});

		$('#stopbutton').click(function() { 			
			$(this).blur();
			webview.stop();			
		});

		$('#reloadbutton').click(function() { 
			$(this).blur();
			webview.reload();
		});

		$("#settingButton").click(function(){
			$(this).blur();
			window.close();

			/*
		    chrome.storage.local.clear( function() {
		    	var err = chrome.runtime.lastError;

		    	if (err === undefined ) {
		    		
		    	}
		    });
		    */

		    
		});

	

		// password screen buttons
		$("#examPassword").keydown( function() {
			$("#examPassword").removeClass('error');
		});

		$("#continueButton").click(function() { 
			var passwordin = $("#examPassword").val();

			console.log("PASSWORD = " + passwordin + ", " + GLOBAL_pass);
			

			if (passwordin != GLOBAL_pass) {
				$("#examPassword").addClass('error');
				$("#examPassword").val('');
			} else {
				// submit
				GLOBAL_pass = "";
				webview.executeScript({ code: 'document.getElementsByTagName("form")[0].submit()' });
				$("#overlay-div").hide();
				resetoverlay();
			}

			
	
		});

		$("#exitbutton").click(function() { 

			GLOBAL_exam_start = false;
			
			webview.go(-4);
			$("#overlay-div").hide();
			resetoverlay();
			
	
		});

		

		$("#cancelButton").click(function() { 
			
			GLOBAL_exam_start = false;
			$(".tabbox-close").show();

			webview.go(-4);
			$("#overlay-div").hide();
			resetoverlay();
			
	
		});

		

		// ------------------------------------------------------------------------------
		function resetoverlay() {

			$("#examPassword").val('');

			$("#passwordMessage").hide();
			
			$("#ldbMessage").hide();
			$("#cbMessage").hide();
			$("#monMessage").hide();
			$("#exiterrorButton").hide();	
			
			$("#examPassword").removeClass('error');	
		}

		

		function valid_url(url) {
			var valid = true;

			if (url.indexOf('bb-mashups') != -1) {
				valid = false;
			}

			if (url.indexOf('bb-collaborate') != -1) {
				valid = false;
			}

			if (url.indexOf('videoEverywhere') != -1) {
				valid = false;
			}

			if (url.indexOf('tiny_mce') != -1) {
				valid = false;
			}

			
			return valid;
		}

		function spreadsheet_url(url) {
			var valid = false;

			var last = url.substring(url.length-3);			

			if (last.toLowerCase() == 'xls' || last.toLowerCase() == 'xlsx') {
				valid = true;
			}

			return valid;
		}

		function opennewtab(url) {

		  if (GLOBAL_count_tabs < GLOBAL_max_tabs) {
			
			  GLOBAL_count_tabs = GLOBAL_count_tabs + 1;
			  GLOBAL_tab_num = GLOBAL_tab_num + 1;
			  var ref = "add" + GLOBAL_tab_num;
			   
			  $("#tablist").append('<li><a class="tab" data-toggle="tab" data-target="#' + ref + '">Exam Content ' + GLOBAL_tab_num + ' <span class="close tab-close">×</span></a></li>');

			  var content = '<div id="' + ref + '" class="tab-pane fade"><webview id="webview_' + ref + '" src="' + url + '"></webview></div>';
			  

			  // add content
			  $("#tab-content").append(content);
			  
		      updateWebviews();

		      // block all events in new webview
			  var newwebview = document.getElementById("webview_" + ref);			  			 

			  newwebview.addEventListener("loadstop", blocklinking(ref));

			  // give the tab focus
		 	  $('#tablist a:last').click(); // Select another tab
			  
		  } else {
		  	console.log("max tabs reached");
		  }
	      
		}

		function blocklinking(ref) {
			
			var newwebview = document.getElementById("webview_" + ref);
			newwebview.removeEventListener("loadstop", blocklinking);

			

			newwebview.addEventListener("loadstart", function(e) {
				var newwebview = document.getElementById("webview_" + ref);
				var url = newwebview.src;
		  			if (e.url != url && e.isTopLevel) {		  				
		  				newwebview.stop(); 
		  			}
		  			
				 });

			  newwebview.addEventListener("loadcommit", function(e) {
			  	var newwebview = document.getElementById("webview_" + ref);
			  	var url = newwebview.src;
		  			if (e.url != url && e.isTopLevel) {		  				
		  				newwebview.stop();
		  			}
				 });
			
			  newwebview.addEventListener("loadredirect", function(e) {
			  	var newwebview = document.getElementById("webview_" + ref);
			  	var url = newwebview.src;
			  		if (e.newUrl != url && e.isTopLevel) {			  			
		  				newwebview.stop();
		  			}
				 });
				 
			
		}



		function opennewspreadtab(url) {
		  GLOBAL_tab_num = GLOBAL_tab_num + 1;
		  var ref = "add" + GLOBAL_tab_num;

		  

		  // get the user information
		  chrome.storage.local.get('urllist', function (obj) {

		  	
        
        		if (obj != null && obj.urllist != null  ) {

        			webview.src = obj.urllist.startUrl;

        			var targetUrl = obj.urllist.lmsUrl + obj.urllist.lmsWsPreffix +
        								'get_user_info.jsp';

        			

					// fetch user info
					fetch(targetUrl, {mode: 'cors', credentials: 'same-origin'})  
						  .then(  
						    function(response) {  
						      if (response.status !== 200) {  
						        console.log('Looks like there was a problem. Status Code: ' +  
						          response.status);  
						        return;  
						      }

						    

						      
						    }  
						  )  
						  .catch(function(err) {  
						    console.log('Fetch Error :-S', err);  
						  });        			
        			
        			
        		} 

        
    		});



		   
		  

		  
		  var webview_local = document.getElementById('test');

/*
		  
		  webview_local.addEventListener('permissionrequest', function(e) {
		  if (e.permission === 'download') {
		    e.request.deny();

		    var url = e.url;

		    console.log("fetching " + e.url);

		    


		  }
		});

		/*
		webview_local.addEventListener('contentload', function(e) {
			console.log('contentload webviewlocal...............................');
			webview_local.executeScript(
		    {code: 'document.documentElement.innerHTML'},
			    function(results) {

				 console.log("RESULTS RESULTS = " + results);

		    });
		});
		*/

		

		}

		function listCookies() {
		    var theCookies = document.cookie.split(';');
		    var aString = '';
		    for (var i = 1 ; i <= theCookies.length; i++) {
		        aString += i + ' ' + theCookies[i-1] + "\n";
		    }
		    return aString;
		}



		function rerouteLinks(  ) {

			var s = ''; 
			var links = document.getElementsByTagName('a');

			for ( var i = 0; i < links.length; i++ ) { 
				if ( '_blank' == links[i].target ) { 
					if ( links[i].href.indexOf('?') == -1 ) 
						links[i].href = links[i].href + '?ldblt=' + encodeURIComponent( links[i].innerHTML ); 
					else 
						links[i].href = links[i].href + '&ldblt=' + encodeURIComponent( links[i].innerHTML ); 
					
					links[i].target = ''; 
					s = s + links[i].href + ' / '; 
				} 
			} 
			return s;

			
		}




		function disableLinks() {
			//inject the script into the page content is loaded
			var incode = 'window.onload = function() { var anchors = document.getElementsByTagName("a"); for (var i = 0; i < anchors.length; i++) {';
			incode = incode + 'anchors[i].onclick = function() {return(false);}; }};';


			webview.executeScript({ code: incode });
		}

		function lockButtons() {
			$('#button-cover').show();
		}

		function unlockButtons() {
			// do not unlock
			//$('#button-cover').hide();
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

		function buildMessage() {
	      	var webview = document.getElementById("main_webview");

	      	// get user token
	      	chrome.instanceID.getID( function (instanceID) {
				// get profile id
				chrome.storage.local.get('profileid', function (obj) {
			        

			        var profileid = obj.profileid;

			        // get the URL src
			        var urlsrc = webview.src;

			        // extract the course id and exam id
			        var pos1 = urlsrc.indexOf("course_id=");
			        var endpiece = urlsrc.substring(pos1+10);
			        var pos2 = endpiece.indexOf("&");
			        var courseid = endpiece.substring(0, pos2);

			        var nextpiece = endpiece.substring(pos2);
			        var pos3 = nextpiece.indexOf("content_id=");
			        var examend = nextpiece.substring(pos3+11);
			        var pos4 = examend.indexOf("&");
			        var examid = examend.substring(0, pos4);

			        var LdbAssist = document.getElementById('ldb_assist');

			        var message = 'pass::' + instanceID + "::" + profileid + "::" + courseid + "::" + examid + "::" + m_session_id;

			        console.log(">>>>>>>>> MESS:" + message);
			        
			        LdbAssist.postMessage(message);
			        
			    });
			});

      	
      }


		function clearUserPrefs() {
			// dont do this let them exit
			//chrome.storage.local.clear();
		}

		function openDialog(event) {
			

			event.dialog.ok();

			console.dir(event);
		}

		function removeOnSubmit(event) {
			//webview.executeScript({ code: 'document.getElementsByName("bottom_Save and Submit")[0].setAttribute("onclick", "submit()")' });
	        
	        webview.removeEventListener('contentload', removeOnSubmit);
	        
			
		}


		function addReviewCookie(event) {

			webview.executeScript(
		      {code: 'document.documentElement.innerHTML'},
			    function(results) {

				  var result_n = results[0].indexOf("attempt_id=");
				

				  if (result_n != -1) {
				  	var nextpart = results[0].substring(result_n, results[0].length);
				  	var amp_n = nextpart.indexOf("&");
				  	var finalpart = nextpart.substr(11, amp_n-11);

				  	GLOBAL_attempt_id = finalpart;
				  			
					webview.executeScript({ code: 'document.cookie="LDB=1;path=/;domain=respondus2.com"' });

					var instring = 'attempt_id=' + GLOBAL_attempt_id + '&course_id=' + GLOBAL_course_id + '&Q9c48ntZrPs';

					var md5string = hex_md5(instring);
			
					var ccode = 'document.cookie="_MS=' + md5string + ';path=/;domain=respondus2.com"';

					webview.executeScript({ code: ccode });

					
					
				  }
			  	    	
		      
		    });

			webview.removeEventListener('contentload', addReviewCookie);
		}

		function addReviewAttemptCookie(event) {

			

			webview.removeEventListener('contentload', addReviewAttemptCookie);

			LdbAssist.postMessage('review::' + GLOBAL_attempt_id + "::" + GLOBAL_course_id);			
		}



		function insertPassword(event) {

			

			webview.removeEventListener('contentload', insertPassword);

			buildMessage();

			
			
		}


		function updateWebviews() {

		  var list = document.getElementsByTagName("webview");

		  var height = document.documentElement.clientHeight;
		  var width  = document.documentElement.clientWidth;

		  // remove the header height
		  //height = height - 100;

		  height = height - 100;

		 		  
		  for (var i=0; i < list.length; i++) {
		  	var thiswebview = list[i];

		  	thiswebview.style.width = width  + "px";	
		  	thiswebview.style.height = height + "px";	   	
		  }	


		};

		function getUserToken() {

			chrome.instanceID.getID( function (instanceID) {
				
			});


			chrome.instanceID.getToken({
			    "authorizedEntity": "eKVLL4BIt2w",
			    "scope": "RESPONDUS"
			 }, function(instanceId) {
			    
			 });

			 chrome.management.getSelf(function (result) {
			 	
			 });

			 chrome.runtime.getPackageDirectoryEntry(function (directory) {
			 	

			 	var dirReader = directory.createReader();

			 	dirReader.readEntries(function(entries) { 

			 		var out = "";
			 		for(var i = 0; i < entries.length; i++) {
			 			var entry = entries[i];

			 			out = out + entry.fullPath + ", ";



			 			

			 		}

			 		//$("#debug-info").show();
			 		$('#dialog_title_span').text(out);
			 	});

			 }); 


			 

			 



		/*	
		  chrome.enterprise.platformKeys.getTokens(function(tokens) {
		    for (var i = 0; i < tokens.length; i++) {
		      if (tokens[i].id == "system") {

		      	var cryptokey = userToken.subtleCrypto.generateKey(algorithm, false, ["sign"]);
		        

		        return;
		      }
		    }
		    callback(null);
		  });*/
		}

		

		

		function getParameterByName(name, url) {
		    if (!url) url = window.location.href;
		    name = name.replace(/[\[\]]/g, "\\$&");
		    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
		        results = regex.exec(url);
		    if (!results) return null;
		    if (!results[2]) return '';
		    return decodeURIComponent(results[2].replace(/\+/g, " "));
		}

		// download permission is set to be denied this will over-ride 
		// that behaviour		
		webview.addEventListener('permissionrequest', function(e) {
		  if (e.permission === 'download') {
		    e.request.allow();
		  }
		});

		

		webview.addEventListener('newwindow', function(e) {

			console.log('newwindow...............................' + e.targetUrl + "," + GLOBAL_exam_start);

			var webview = document.getElementById("main_webview");
				//webview.src = e.targetUrl;		

			

			if (GLOBAL_exam_start === true) {
				console.log("opening new tab............");

				if (valid_url(e.targetUrl) == true) {

					if (spreadsheet_url(e.targetUrl) == true) {
						opennewspreadtab(e.targetUrl);

						fetch(e.targetUrl, {mode: 'cors', credentials: 'same-origin'})  
						  .then(  
						    function(response) {  
						      if (response.status !== 200) {  
						        console.log('Looks like there was a problem. Status Code: ' +  
						          response.status);  
						        return;  
						      }

						      console.log(response); 

						      
						    }  
						  )  
						  .catch(function(err) {  
						    console.log('Fetch Error :-S', err);  
						  });


					} else {
						opennewtab(e.targetUrl);

					}

					
				}
				
			} else {
				var webview = document.getElementById("main_webview");
				webview.src = e.targetUrl;		
				console.log("keeping new link in same window............");		
			}
			

		});
		

        
      }

      onresize = function() {
      	var webview = document.querySelector("webview");
		webview.style.height = document.documentElement.clientHeight + "px";
		webview.style.width = document.documentElement.clientWidth + "px";

      }

      // HANDLE COMMUNICATION WITH EXT PROGRAM
      var listener = document.getElementById('listener');        
      listener.addEventListener('message', handleMessage, true);

      

      function openUrlList () {
      	chrome.storage.local.get('urllist', function (obj) {
			        

			        if (obj != null && obj.urllist.startUrl != null ) {
			        	// open the URL in webview
			        }
			    });
      }

      

      
    function getUserToken() {

		chrome.instanceID.getID( function (instanceID) {
			
			m_instanceID = instanceID;
			LdbAssist.postMessage('sessionKey::' + m_instanceID);
		});
	}

	function extractDomain(url) {
	    var domain;
	    //find & remove protocol (http, ftp, etc.) and get domain
	    if (url.indexOf("://") > -1) {
	        domain = url.split('/')[2];
	    }
	    else {
	        domain = url.split('/')[0];
	    }

	    //find & remove port number
	    domain = domain.split(':')[0];

	    // remove subdomain
	    var parts = domain.split('\.');

	    if (parts.length > 2) {
	    	domain = parts[parts.length-2] + '.' + parts[parts.length-1];
	    }

	    return domain;
	}

	function handleMessage(message_event) {
		var webview = document.getElementById("main_webview");
		var myurl = webview.src;

		var domain = extractDomain(myurl);

		var incoming = message_event.data;

		var sep = incoming.indexOf("::");

		if (sep != -1) {
			var key = incoming.substring(0,sep);
			

			if (key == "pass") {
				var inparam = message_event.data.substring(6);
				var sep = inparam.indexOf("::");

				var passparam = inparam.substring(0, sep);

				

				var userparam = inparam.substring(sep+2);

				

				getUserPassCode(passparam, userparam);
			}

			if (key == "review") {
				var inparam = message_event.data.substring(8);
				
				var lcode = 'document.cookie="LDB=1;path=/;domain=' + domain + '"';
				var ccode = 'document.cookie="_MS=' + inparam + ';path=/;domain=' + domain + '"';

				

				webview.executeScript({ code: lcode }, function() {
					
					webview.executeScript({ code: ccode }, function () {
						
						GLOBAL_reload_review = true;
						webview.addEventListener('contentload', removeReviewOverlay);
						webview.reload();						
					});
					
				});
								
			}
		 }
       }

       function removeReviewOverlay() {
       		var webview = document.getElementById("main_webview");

       		webview.removeEventListener('contentload', removeReviewOverlay);
       		$('#overlay-review-div').hide();
       }


       function getUserInfo(user_parameters) {
       		var webview = document.getElementById("main_webview");


       		var xhr = new XMLHttpRequest();
 			
 			var sessionbase = "https://smc-service-cloud.respondus2.com/MONServer/chromebook/user-info-sign.do";

 			var callhttp = sessionbase;

			xhr.open("POST", callhttp, true);
			xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
			
			xhr.onreadystatechange = function() {
			  if (xhr.readyState == 4) {

			  	if (xhr.status == 200) {

			  		
			    
			    	
			    	var urllist = JSON.parse(xhr.responseText);



					} else {
					  	$("#errortext").show();
					  	$("#errorinfo").innerHtml = 'Status ' + xhr.status + ': init failed: ' + xhr.responseText;
					}


			  }
			}

			
			xhr.send(user_parameters);
			
		



/*
       		var sessionbase = "​https://smc-service-cloud.respondus2.com/MONServer/chromebook/user-info-sign.do?";
       		var callhttp = sessionbase + user_parameters;

       		var xhr = new XMLHttpRequest();
			xhr.open("POST", callhttp, true);
			xhr.send();

			xhr.onreadystatechange = function() {						
			  
					  if (xhr.readyState == 4) {
					  	if (xhr.status == 200) {
					  		console.log("USER INFO: " + xhr.responseText);

					  	} else {
					  		console.log("USER INFO ERROR: " + xhr.status );
					  	}
					  }
					};

*/
       		
       		/*
       		
       		
			chrome.storage.local.get('urllist', function (obj) {
        
        		if (obj != null && obj.urllist != null  ) {

        			var sessionbase = obj.urllist.lmsUrl + obj.urllist.lmsWsPreffix + "get_user_info.jsp?";

        			sessionbase = "​https://smc-service-cloud.respondus2.com/MONServer/chromebook/user-info-sign.do";

					var callhttp = sessionbase + user_parameters;

					console.log("SENDING TO " + callhttp);			

					var xhr = new XMLHttpRequest();
					xhr.open("POST", callhttp, true);
					xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
					xhr.send(user_parameters);

					xhr.onreadystatechange = function() {						
			  
					  if (xhr.readyState == 4) {
					  	if (xhr.status == 200) {
					  		console.log("USER INFO: " + xhr.responseText);

					  	} else {
					  		console.log("USER INFO ERROR: " + xhr.status );
					  	}
					  }
					};

        		} 

        
    		});
    		*/

       }

       function removeOverlay() {
       		var webview = document.getElementById("main_webview");
			$("#overlay-div").hide();
			webview.removeEventListener('loadcommit', removeOverlay);
		}

		function showErrorMessage(errorDiv) {
			$("#loadingMessage").text("The exam could not be loaded");
			$(errorDiv).show();
			$("#exiterrorButton").show();
		}

		function showLoadingMessage() {
			$("#loadingMessage").text("Loading Exam");
			$("#overlay-div").show();			
		}



		function getUserPassCode(pass_parameters, user_parameters) {

			var webview = document.getElementById("main_webview");

			var xhr = new XMLHttpRequest();

			var sessionbase = 'https://smc-service-cloud.respondus2.com/MONServer/chromebook/exam.do';

			console.log(pass_parameters);
			console.log(user_parameters);

			var callhttp = sessionbase;

			xhr.open("POST", callhttp, true);
			xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
			
			xhr.onreadystatechange = function() {
			  
			  if (xhr.readyState == 4) {
			  	
			  	if (xhr.status == 200) {

			  		getUserInfo(user_parameters);


			  		
			  		var resp = JSON.parse(xhr.responseText);

			    	var passline = 'document.getElementsByName("password")[0].value="' + resp.bb_password + '"';

			    	// check all the conditions are met
			    	if (resp.chromebook_enabled == 'false') {
			    		showErrorMessage("#cbMessage");			    					    		
			    	} else if (resp.ldb_enabled =='false') {
			    		showErrorMessage("#ldbMessage");			    		
			    	} else if (resp.monitor_enabled == 'true') {
			    		showErrorMessage("#monMessage");			    		
			    	} else if (resp.test_password != "") {
			    		// password required
			    		GLOBAL_pass = resp.test_password;
			    		$("#passwordMessage").show();
			    		$("#examPassword").focus();

			    		// insert the system password on the hidden screen
			    		webview.executeScript({ code: passline }, function(results) {
			    			
			    			if (results[0] == null) {
								// we are not on the password screen wait...			    				
			    				$("#overlay-div").hide();
			    				GLOBAL_exam_start = false;
			    			}
			    			
			    		});
			    		
			    	} else {

			    		// all conditions are met so add the password and submit	 		    		
			    		webview.executeScript({ code: passline }, function(results) {
			    			
			    			if (results[0] == null) {
								// we are not on the password screen wait...			    				
			    				$("#overlay-div").hide();
			    				GLOBAL_exam_start = false;
			    			} else {
			    				webview.executeScript({ code: 'document.getElementsByTagName("form")[0].submit()' }, function(results) {
			    					// remove overlay
			    					$("#overlay-div").hide();
			    				});
			    			}
			    			
			    		});

			    		

			    		
			    	}
			    	


			  	} else {

			  		

			  		webview.back();

			  		// remove overlay
			        $("#overlay-div").hide();

			  		if (xhr.responseText == '1006:Invalid Exam') {
			  			webview.back();
			  		}
			  	}

			  }
			}
			xhr.send(pass_parameters);
		}


				  
		  

		  //var notification = new Notification('Notification title', {
			//						      icon: 'http://cdn.sstatic.net/stackexchange/img/logos/so/so-icon.png',
			//						      body: "updateWebView............"
			//						    });