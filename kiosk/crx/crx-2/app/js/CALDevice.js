/*global $, jQuery, chrome, CALPreferences */
/*jshint globalstrict: true*/
/**
 * Created by ntallmon on 10/2/2014.
 */
var CALDevice = {
    /**
     *
     * @param json
     * @param cb
     */
    isSecure: function (json, cb) {
        chrome.runtime.getBackgroundPage(function (bgPage) {
            json.isSecure = bgPage.kioskMode
            json.dataJson = { "isSecure": json.isSecure };
            if (cb) {
                cb(json);
            }
        });
    },

    exit: function () {
        window.close();
    }
};
