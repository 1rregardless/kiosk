"use strict";

const whoIsPrimary = 'IBT2C_WHO-IS-PRIMARY?';
const DELIMITER = '\x1F';
const IBT2_C_DEL = 'ibt2c' + DELIMITER;
const PORT = 30001;
const GROUP = '230.0.1.1';
//Time to Live. how many networks packet is allowed to hop before giving up on destination
var TTL = 128; 
var NotConnectedException = "Not Connected";
var returnOnFirstCPResponse = false;
var timeout = 10000;

var cpFinder = {

    findPrimaryCP : function(returnFirst, cpAvailableCallback) {

        var socket = chrome.sockets.udp;
        var connected = false;
        var socketId = null;
        var uiCPAvailableCallback;
        var cpDict = {};

        function sendMessageCallback(resultCode) {
            //print logs
            if(resultCode >= 0)
                console.log ('Multicast message has been sent successfully');
            else {  		
                console.log ('Failed to send Multicast message.');
            }	
        }

        function sendMulticastMessages(socket, socketId) {	
            console.log('whoIsPrimary:' + whoIsPrimary);

            var message = new TextEncoder().encode(whoIsPrimary);

            console.log ('Sending message:' + message + ' three times');
            
            socket.send(socketId, message, GROUP, PORT,sendMessageCallback);
            socket.send(socketId, message, GROUP, PORT,sendMessageCallback);
            socket.send(socketId, message, GROUP, PORT,sendMessageCallback);
        }

        function onMessageReceived(info) {   
            var enc = new TextDecoder("utf-8");
            var messageStr = enc.decode(info.data);
            console.log ('Message Received (From: ' + info.remoteAddress + ':' + info.remotePort + ') : ' + messageStr);
            if(messageStr !== whoIsPrimary)
            {
                var idx = messageStr.indexOf(IBT2_C_DEL);
                
                if(idx == -1)
                {
                    console.log('index == - 1 for first search');
                    return;
                    
                }
                    
                messageStr = messageStr.substring(idx+IBT2_C_DEL.length);
                
                idx = messageStr.indexOf(IBT2_C_DEL);
                
                if(idx == -1)
                {
                    console.log('index == - 1 for second search');
                    return;
                }	
                                
                messageStr = messageStr.substring(0,idx);
                var cpsObj = JSON.parse(messageStr);
                                
                if(!(cpsObj.cpId in cpDict))
                    cpDict[cpsObj.cpId] = cpsObj;
                else
                    console.log (' cpsObj.cpId : duplicate reply');
                
                if(returnOnFirstCPResponse)
                {
                    socket.close(socketId, onSocketCloseCallback);
                    returnOnFirstCPResponse=false;	
                }					
            }            
        } 

        function onSocketCloseCallback() {
            console.log('Calling CP Available callback');
            uiCPAvailableCallback(cpDict);
            cpDict={};
        }

        function onDiscoveryTimeout() {
            console.log('CP discovery time is up');
            
            if(socket){
                console.log('calling socket.close() ');	
                try{	
                    socket.close(socketId, onSocketCloseCallback);
                }
                catch(error){
                    console.log('error in closing socket',error);
                }
            }
        }

        function initSocket() {
            socket.create({bufferSize: 1024 * 1024}, function(createInfo) {
                socketId = createInfo.socketId;
                socket.setMulticastLoopbackMode(socketId, false, function(result) {});
                socket.setMulticastTimeToLive(socketId, TTL, function (result) {                        
                    if (result != 0) {
                      console.error ("Set TTL Error: ", "Unknown error");
                    }
                    socket.bind(socketId, "10.44.36.21", PORT, function(connectionResult) {
                        if (connectionResult != 0) {
                            socket.close(socketId, onSocketCloseCallback)
                        } else {
                            connected = true;
                            socket.joinGroup(socketId, GROUP, function(result) {
                                if (result != 0) {
                                    socket.close(socketId, onSocketCloseCallback);
                                } else {
                                    socket.onReceive.addListener(onMessageReceived);
                                    sendMulticastMessages(socket, socketId);
                                    setTimeout(onDiscoveryTimeout, timeout);
                                }
                            })
                        }
                    });
                });
            });
        }

        returnOnFirstCPResponse = returnFirst;	
        uiCPAvailableCallback = cpAvailableCallback;
        initSocket();
    }
};