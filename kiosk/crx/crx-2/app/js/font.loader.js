var fontLoader = (function() {
    
    const fontMap = {
        "MS Gothic": "fonts/MS-Gothic.woff",
        "SimSun": "fonts/SimSun.woff",
        "MS Hei": "fonts/mshei.woff"
    };

    var fontArrays = {};

    function init() {
        for (const property in fontMap) {
            if (!document.fonts.check("10px " + property)) {
                console.log("packaged app loading font: " + property);
                loadFontFromFile(property);
            }
        }
    }

    function loadFontFromFile(fontName) {
        var request = new XMLHttpRequest();
        request.addEventListener('readystatechange', function (e) {
            if (request.readyState == 2 && request.status == 200) {
                // Download is being started
            }
            else if (request.readyState == 3) {
                // Download is under progress
            }
            else if (request.readyState == 4) {
                // Downloading has finished

                // request.response holds the binary data of the font

                fontArrays[fontName] = request.response;
            }
        });

        request.responseType = 'arraybuffer';

        // Downloading a font from the path
        request.open('get', fontMap[fontName]);

        request.send();
    }

    function arrayBufferToBase64(buffer) {
        var binary = '';
        var bytes = new Uint8Array(buffer);
        var len = bytes.byteLength;
        for (var i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        var rtnValue = btoa(binary);
        return rtnValue;
    }

    function getFontData(fontName) {
        return arrayBufferToBase64(fontArrays[fontName]);
    }
    return {
        init : init,
        getFontData : getFontData
    }

})();