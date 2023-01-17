
onload = function() {

	window.onkeydown = window.onkeyup = function(e) { console.log("keydown detected - " + e.keyCode); if (e.keyCode == 27 /* ESC */) { e.preventDefault(); } };

	window.onresize = function() {
			console.log('been resized');
			maxWindow();
	}

	$("#clear-error").click(function() {
		window.close();
	}); 

	


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
}