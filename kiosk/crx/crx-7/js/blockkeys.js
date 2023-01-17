
window.addEventListener("contextmenu", function(e) {
    e.preventDefault();
});


window.addEventListener('keydown', restrictedKeys, false);


function restrictedKeys(event) {
    console.log("keydown", event);

    var key = event.key;
    if (key == undefined || key == null) {
        console.log("event special", event);
        return;
    }

    if (event.ctrlKey) {
        return ctrlKeys(event);
    } else if (event.altKey) {
        return altKeys(event);
    } else if (event.shiftKey) {
        return shiftKeys(event);
    } else {
        return singleKeys(event);
    }
}


function singleKeys(event) {
    var key = event.key;

    switch (key.toUpperCase()) {
        case "F1":
        case "F3":
        case "F5":
        case "F7":
            return stopEvent(event);
            break;
    }
}


function ctrlKeys(event) {
    var key = event.key;

    //shift pressed with ctrl
    if (event.shiftKey) {
        switch (key.toUpperCase()) {
            case "A":
            case "B":
            case "DELETE":
            case "G":
            case "H":
            case "M":
            case "N":
            case "P":
            case "Q":
            case "T":
            case "TAB":
            case "W":
                return stopEvent(event);
                break;
        }
    }

    //single key with ctrl
    switch (key.toUpperCase()) {
        case "+":
        case "-":
        case "A":
        case "B":
        case "D":
        case "F":
        case "F1":
        case "F3":
        case "F4":
        case "G":
        case "H":
        case "I":
        case "J":
        case "L":
        case "N":
        case "O":
        case "P":
        case "PAGEDOWN":
        case "PAGEUP":
        case "Q":
        case "R":
        case "S":
        case "T":
        case "TAB":
        case "U":
        case "W":

        case "0":
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
        case "6":
        case "7":
        case "8":
        case "9":
            return stopEvent(event);
            break;
    }
}


function altKeys(event) {
    var key = event.key;

    //single key with ctrl
    switch (key.toUpperCase()) {
        case "ARROWRIGHT":
        case "ARROWLEFT":
        case "B":
        case "F":
        case "F4":
        case "HOME":
            return stopEvent(event);
            break;
    }
}


function shiftKeys(event) {
    var key = event.key;

    //single key with ctrl
    switch (key.toUpperCase()) {
        case "ESCAPE":
            return stopEvent(event);
            break;
    }
}


function stopEvent(event) {
    stopPropagation(event);
    preventDefault(event);
    return event.returnValue = false;
}


function stopPropagation(event) {
    if (event.stopPropagation) {
        event.stopPropagation();
    } else {
        event.cancelBubble = true;
    }
}


function preventDefault(event) {
    if (event.preventDefault) {
        event.preventDefault();
    } else {
        event.returnValue = false;
    }
}