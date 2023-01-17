


function getDeviceInfo() {
    
    return new Promise((resolve, reject ) =>{
        chrome.instanceID.getID(function (instanceID) {
            console.log("Device ID is ", instanceID);
            deviceId = instanceID.toUpperCase();
             resolve(deviceId);
            
        })
    })
    
}


  
  