'use strict';
chrome.app.runtime.onLaunched.addListener(function (launchData) {
    var systemInfo = { launchData: launchData, manifest: chrome.runtime.getManifest() };

    chrome.runtime.getPlatformInfo(function (info) {
        console.log("Platform Info os: " + info.os + ", arch: " + info.arch + ", nacl-arch: " + info.nacl_arch);
        systemInfo.platformInfo = info;

        chrome.system.cpu.getInfo(function (info) {
            console.log("CPU Info model: " + info.modelName + ", arch: " + info.archName + ", num: " + info.numOfProcessors);
            systemInfo.cpuInfo = info;

            chrome.system.memory.getInfo(function (info) {
                console.log("Memory Info available: " + (info.availableCapacity / 1024 / 1024) +
                    "Mb, capacity: " + (info.capacity / 1024 / 1024) + "Mb");
                systemInfo.memoryInfo = info;

                chrome.system.display.getInfo(function (info) {
                    systemInfo.displayInfo = info;

                    chrome.system.network.getNetworkInterfaces(function (info) {
                        systemInfo.netInfo = info;

                        info.forEach(function (v) {
                            console.log("Network Info address: " + v.address + ", name: " + v.name);
                            var addr = v.address.toUpperCase();
                            var start = "FE80::", middle = "FF:FE";
                            var idxMiddle = addr.indexOf(middle);
                            if (addr.startsWith(start) && (idxMiddle > 0)) {
                                addr = addr.substring(start.length, idxMiddle) + addr.substring(idxMiddle + middle.length);
                                var parts = addr.split(':');
                                addr = "";
                                if (parts.length === 3) {
                                    var i;
                                    for (i = 0; i < 3; i++) parts[i] = parseInt(parts[i], 16);
                                    parts[0] ^= 512;
                                    for (i = 0; i < 3; i++) {
                                        var hi = Math.floor(parts[i] / 0x100), lo = parts[i] % 0x100;
                                        console.log(parts[i].toString(16) + '=' + hi.toString(16) + '-' + lo.toString(16));
                                        if (addr.length > 0) addr += '-';
                                        addr += ((hi < 0x10) ? "0" : "") + hi.toString(16) + '-';
                                        addr += ((lo < 0x10) ? "0" : "") + lo.toString(16);
                                    }
                                    addr = addr.toUpperCase();
                                    if (!systemInfo.macAddress) {
                                        systemInfo.macAddress = addr;
                                    }
                                    else {
                                        if (!systemInfo.macAddresses) {
                                            systemInfo.macAddresses = [systemInfo.macAddress];
                                        }
                                        if (v.name.startsWith("wlan")) {
                                            systemInfo.macAddresses.unshift(addr);
                                            systemInfo.macAddress = addr;
                                        }
                                        else {
                                            systemInfo.macAddresses.push(addr);
                                        }
                                    }
                                    console.log("MAC: " + addr);
                                }
                            }
                        });

                        chrome.instanceID.getID(function (instanceID) {
                            console.log("instanceID: " + instanceID);
                            systemInfo.instanceID = instanceID;

                            function showMainWindow() {
                                chrome.app.window.create('main.html',
                                    { id: "eToBrowserHost", height: screen.height, width: screen.width },
                                    function (createdWindow) {
                                        createdWindow.contentWindow.systemInfo = systemInfo;
                                    });
                            }

                            if (chrome.enterprise && chrome.enterprise.deviceAttributes) {
                                chrome.enterprise.deviceAttributes.getDirectoryDeviceId(function (deviceID) {
                                    console.log("deviceID: " + deviceID);
                                    systemInfo.deviceID = deviceID;

                                    showMainWindow();
                                });
                            }
                            else {
                                showMainWindow();
                            }
                        });
                    });
                });
            });
        });
    });
});
