var map = {}; 
document.onkeydown = document.onkeyup = checkKey;

function checkKey(e) {

    e = e || window.event;

    
    map[e.keyCode] = e.type == 'keydown';


    // do not allow the arrow keys on CB to go back or forward
    if (e.keyCode == 166 || e.keyCode == 167) {

        e.stopPropagation();
        e.preventDefault();

        window.stop();
        
    }

    

    if(map[18]) { // ALT is pressed

    	if(map[65]) { 
    		if(map[16]) { 
    			document.activeElement.value = document.activeElement.value + "Á";
    		} else {
    			document.activeElement.value = document.activeElement.value + "á";
    		}
    	}
    	if(map[69]) { 
    		if(map[16]) { 
    			document.activeElement.value = document.activeElement.value + "É";
    		 } else {
    		 	document.activeElement.value = document.activeElement.value + "é";
    		 }

    	}
    	if(map[73]) { 
    		if(map[16]) { 
    			document.activeElement.value = document.activeElement.value + "Í";
	    		} else {
	    			document.activeElement.value = document.activeElement.value + "í";
	    		}
    	}
    	if(map[79]) { 
    		if(map[16]) { 
    			document.activeElement.value = document.activeElement.value + "Ó";
	    		} else {
	    			document.activeElement.value = document.activeElement.value + "ó";
	    		}
    	}
    	if(map[85]) {
    		if(map[16]) {  
    			document.activeElement.value = document.activeElement.value + "Ú";
	    		} else {
	    			document.activeElement.value = document.activeElement.value + "ú";
	    		}
    	}
    	if(map[78]) {
    		if(map[16]) {  
    			document.activeElement.value = document.activeElement.value + "Ñ";
	    		} else {
	    			document.activeElement.value = document.activeElement.value + "ñ";
	    		}
    	}
    	if(map[191]) { 
    		if(map[16]) {      		
    			document.activeElement.value = document.activeElement.value + "¿";
	    	} 
    	}
 	}
}