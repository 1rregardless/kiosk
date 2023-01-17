/**
 * Listens for the app launching then creates the window
 *
 * @see http://developer.chrome.com/apps/app.window.html
 */
console.log("background started!");


function launch(launchdata) {

  chrome.power.requestKeepAwake('display');  

  chrome.runtime.getPlatformInfo(function(info) {

    var manifest = chrome.runtime.getManifest();
    var version = manifest.version;

    console.log(info.os);
      
      

    // if (launchdata.isKioskSession==false && info.os=='win') {
     if (info.os=='cros') {

        chrome.app.window.create('splash.html', {
          id: 'main',
          state: "fullscreen"
        });

         

      } else {
        chrome.app.window.create('wrong.html', {
          id: 'main',
          bounds: { width: 1200, height: 800 }
        });
      }
  });

  
}

function showNotification(storedData) {

  var openTodos = 0;

  if ( storedData[dbName].todos ) {
    storedData[dbName].todos.forEach(function(todo) {
      if ( !todo.completed ) {
        openTodos++;
      }
    });
  }

  if (openTodos>0) {
    // Now create the notification
    chrome.notifications.create('reminder', {
        type: 'basic',
        iconUrl: 'icon_128.png',
        title: 'Don\'t forget!',
        message: 'You have '+openTodos+' things to do. Get cracking!'
      }, function(notificationId) {});
  }
}

chrome.runtime.onMessage.addListener(
    function(message, sender, sendResponse) {
       if(message.name == "getCookie") { // message.name from above
          chrome.cookies.get(message.params, function (cookie) {
             sendResponse({cookie: cookie});
          })         
       }
    });

chrome.app.runtime.onLaunched.addListener(launch);

chrome.alarms.onAlarm.addListener(function( alarm ) {
  chrome.storage.local.get(dbName, showNotification);
});