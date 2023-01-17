var checkManager = (function() {
    const ROOT_DIR = "data";
    const vtool_file_name = "vtool.json";
    window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;

    var lastResults = {};
    var loadTime;

    function _doSave(data, filename, cb) {
        function _saveErrorHandler(fileError) {
            console.error("error saving last check results to " + filename);
            cb();
        }
        window.requestFileSystem(window.PERSISTENT, 1024 * 1024, function (fs) {
            fs.root.getFile(filename, { create: true }, function (fileEntry) {

                // Create a FileWriter object for our FileEntry.
                fileEntry.createWriter(function (fileWriter) {

                    fileWriter.onwriteend = function (e) {
                        console.log('save last check results to ' + filename);
                        cb();
                    };

                    fileWriter.onerror = function (e) {
                        console.error("error saving last check results to " + filename);
                        cb();
                    };

                    var blob = new Blob([data], { type: 'text/plain' });

                    fileWriter.write(blob);

                }, _saveErrorHandler);

            }, _saveErrorHandler);
        }, _saveErrorHandler);
    }

    function save(cb) {
        _makesureDir(ROOT_DIR, function () {
            var filename = ROOT_DIR + "/" + vtool_file_name;
            function _saveErrorHandler(fileError) {
                console.error("error saving last check results to " + filename);
                cb();
            }
            window.requestFileSystem(window.PERSISTENT, 1024 * 1024, function (fs) {
                fs.root.getFile(filename, { create: false }, function (fileEntry) {

                    fileEntry.remove(function () {
                        _doSave(JSON.stringify(lastResults), filename, cb);
                    }, _saveErrorHandler);

                }, function (FileError) {
                    _doSave(JSON.stringify(lastResults), filename, cb);
                });
            }, _saveErrorHandler);
        });
    }


    function load() {
        _makesureDir(ROOT_DIR, function () {
            var filename = ROOT_DIR + "/" + vtool_file_name;
            function errorHandler(fileError) {
                console.error("error loading last check results from " + filename);
            }

            window.requestFileSystem(window.PERSISTENT, 1024 * 1024, function (fs) {
                fs.root.getFile(filename, {}, function (fileEntry) {

                    fileEntry.file(function (file) {
                        var reader = new FileReader();

                        reader.onloadend = function (e) {
                            console.log("load last check results from " + filename);
                            lastResults = JSON.parse(this.result);
                        };
                        reader.readAsText(file);
                    }, errorHandler);

                }, errorHandler);

            }, errorHandler);
        }, function (fileError) { });
    }

    function _makesureDir(path, callback) {
        window.requestFileSystem(window.PERSISTENT, 1024 * 1024,
            function (fs) {
                _createDir(fs.root, path.split("/"), callback);
            },
            function () { });
    }

    function _createDir(rootDirEntry, folders, callback) {
        // Throw out './' or '/' and move on to prevent something like '/foo/.//bar'.
        if (folders[0] == '.' || folders[0] == '') {
            folders = folders.slice(1);
        }
        rootDirEntry.getDirectory(folders[0], { create: true }, function (dirEntry) {
            // Recursively add the new subfolder (if we still have another to create).
            if (folders.length) {
                _createDir(dirEntry, folders.slice(1), callback);
            } else {
                callback();
            }
        }, function (fileError) {
            // not able to create folder, ignore and
            // Recursively add the new subfolder (if we still have another to create).
            rootDirEntry.getDirectory(folders[0], { create: false }, function (dirEntry) {
                // Recursively add the new subfolder (if we still have another to create).
                if (folders.length) {
                    _createDir(dirEntry, folders.slice(1), callback);
                } else {
                    callback();
                }
            }, function (fileError) { });
        });
    };

    function set(name, check) {
        lastResults[name] = check;
    }
    
    function get(name) {
        return lastResults[name]; 
    }

    function populateLastResults(config) {
        let status = "";
        if (config.allcheckPassed)
        {
            status = "pass";
        }
        //status = "pass";
        if  (config.lastrun != null)
        {
            loadTime = config.lastrun;
        } else
        {
            loadTime = new Date().getTime();
        }

        for (var i = 0; i < config.manualchecks.length; i++ ) {
            var check = {};
            check.status = status;
            check.detail = "";
            check.lastrun = loadTime;
            set(config.manualchecks[i], check);
        }

        return lastResults;
    }

    //load();

    return {
        saveResults: save,
        setResult: set,
        getResult: get,
        populateLastResults : populateLastResults,
        getAll: function() {return lastResults;},
        getLoadTime: function() {return loadTime;}  
    };

})();