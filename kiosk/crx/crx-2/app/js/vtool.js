var vtool = (function () {
    const MILLI_SECONDS_PER_DAY = 24 * 60 * 60 * 1000;

    var checks = [];
    var callback = null;

    var checkRunning = false;

    var config = null;

    var systemCheckResult = null;
    var returnSystemResult = false;

    var APCJReadinessSaved = false;

    function doConfig(conf) {
        if (config == null) {
            config = conf;
        }
        if (config.gpoUrl != null) {
            if (systemCheckResult != null) {
                callback(systemCheckResult);
            } else {
                returnSystemResult = true;
            }
        }

        let lastResults = checkManager.populateLastResults(config);
        console.info("lastResults posted to web");
        let postResults = {
            "action" : "postResult",
            "data" : lastResults
        }
        callback(postResults);

        /*let lastResults = {};
        for (let checkname in checkManager.getAll()) {
            let check = checkManager.getResult(checkname);
            if (check.status == "running") {
                continue;
            }
            let durationDays = (new Date().getTime() - check.lastrun) / MILLI_SECONDS_PER_DAY;
            let isPosting = false;
            if (checkname === "CalibrationCheck" && durationDays < parseInt(config.expireDay)) {
                lastResults["CalibrationCheck"] = check;
                isPosting = true;
            } else if (checkname === "AudioCheck2" && durationDays < parseInt(config.expireDayUnifyAudio2)) {
                lastResults["AudioCheck2"] = check;
                isPosting = true;
            }
            if (isPosting) {
                console.info("lastResults posted to web");
                let postResults = {
                    "action" : "postResult",
                    "data" : lastResults
                }
                callback(postResults);
            }
        }  */  
    }

    function pushCheck(checkname) {
        checks.push(checkname);
        runCheck();
    }
    function runCheck(runNextCheck) {
        if (runNextCheck) {
            checkRunning = false;
        }
        if (checkRunning)
            return;
        if (checks.length > 0) {
            var check = checks.shift();
            var checkResult = null;
            if (check === 'AudioCheck2') {
                checkRunning = true;
                checkResult = { 
                    "action": "postResult", 
                    "data": { 
                        "AudioCheck2": { 
                            "name": "Unify Audio Check", 
                            "status": "running", 
                            "detail": "", 
                            "isrequired": true, 
                            "lastrun": new Date().getTime()
                        } 
                    } 
                };
                callback(checkResult);
            } else if (check === 'CalibrationCheck') {
                checkRunning = true;
                checkResult = {
                    "action": "postResult", 
                    "data": {
                        "CalibrationCheck": {
                            "name": "Calibration Settings",
                            "status": "running",
                            "detail": "",
                            "isrequired": true,
                            "lastrun": new Date().getTime()
                        }
                    }
                };
                callback(checkResult);
            } else if (check === 'SystemCheck') {
                chrome.system.memory.getInfo(function(meminfo) {
                    chrome.system.cpu.getInfo(function(cpuInfo) {
                        chrome.runtime.getPlatformInfo(function(platforminfo) { 
                            navigator.webkitTemporaryStorage.queryUsageAndQuota ( 
                                function(usedBytes, grantedBytes) {  
                                    checkResult = {
                                        "action": "postResult",
                                        "data": {
                                            "SystemCheck": { 
                                                "OSCompleteName": platforminfo.os, 
                                                "CpuProcessorName": cpuInfo.modelName, 
                                                "InstalledMemoryInMbytes": Math.round(meminfo.capacity/1024/1024), 
                                                "FreeMemoryInMbytes": Math.round(meminfo.availableCapacity/1024/1024), 
                                                "FreeDiskSpaceInMbytes": Math.round(grantedBytes/1024/1024), 
                                                "name": "System Check", 
                                                "status": "pass", 
                                                "detail": "", 
                                                "isrequired": true, 
                                                "lastrun": new Date().getTime() 
                                            }
                                        } 
                                    };
                                    if (returnSystemResult) {
                                        callback(checkResult);
                                    } else {
                                        systemCheckResult = checkResult;
                                    }
                                    checkManager.setResult("SystemCheck", checkResult.data.SystemCheck);
                                    checkRunning = false;    
                                }, 
                                function(e) { console.log('Error', e);  }
                            );
                        });
                    });
                });     
                
            } else {
                checkRunning = false;
            }
        } else {
            checkRunning = false;
        }
    }

    function registerCallback(callback1) {
        callback = callback1;
    }

    function postResult(result) {
        if (result.AudioCheck2) {
            checkManager.setResult("AudioCheck2", result.AudioCheck2);
        } else if (result.CalibrationCheck) {
            checkManager.setResult("CalibrationCheck", result.CalibrationCheck);
        }
    }

    function getCheckResultsForAPCJ() {
        if (APCJReadinessSaved || config == null)
            return null;
        APCJReadinessSaved = true;
        let returnObject = {};
        let lastResults = checkManager.getAll();
        let allPassed = true;
        let checksRun = []
        let allchecks = config.autochecks.concat(config.manualchecks);
        let minLastRun = new Date().getTime();
        let maxLastRun = 0;
        for (var i = 0; i < allchecks.length; i++) {
            let checkToRun = allchecks[i];
            let thisPassed = false;
            for (var checkEntry in lastResults)
            {
                var check = lastResults[checkEntry];
                if (checkEntry === checkToRun)
                {
                    if (check.status == "pass")
                    {
                        thisPassed = true;
                    }
                    if (check.lastrun > checkManager.getLoadTime())
                    {
                        let thisCheck = {};
                        thisCheck.testtypeid = checkToRun;
                        thisCheck.srcrundate = check.lastrun;
                        thisCheck.teststatus = check.status == "pass" ? "P" : "F";
                        checksRun.push(thisCheck);
                    }
                    if (check.lastrun < minLastRun)
                    {
                        minLastRun = check.lastrun;
                    }
                    if (check.lastrun > maxLastRun)
                    {
                        maxLastRun = check.lastrun;
                    }
                    break;
                }
            }
            if (!thisPassed) allPassed = false;
        }
        if (checksRun.length > 0)
        {
            returnObject.rdyntesttypelist = checksRun;
            returnObject.overallstatus = allPassed ? "P" : "F";
            returnObject.srcRunDate = minLastRun <= checkManager.getLoadTime() ? minLastRun : maxLastRun;
            return returnObject;
        } else
        {
            return null;
        }
    }

    return {
        doConfig : doConfig,
        pushCheck : pushCheck,
        runCheck : runCheck,
        registerCallback : registerCallback,
        postResult : postResult,
        getCheckResultsForAPCJ : getCheckResultsForAPCJ
    };
})();