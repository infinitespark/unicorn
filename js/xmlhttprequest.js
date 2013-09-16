var ns_ajax = {};
ns_ajax.rate = 999;
ns_ajax.tries = 2;



(function () {
    "use strict"; 
         
    ns_ajax.queueRequest = function(request){
        
        if(!xCore.globalobjects.gmerequests){
           xCore.globalobjects.gmerequests = {}; 
        }
        
        if(!xCore.globalobjects.requestmap){
           xCore.globalobjects.requestmap = {}; 
        }
        
        request.id = guid();
        request.timestamp = new Date().getTime();
        
        //Easy url request finder
        xCore.globalobjects.requestmap[request.url] = request.id;        
                
        //Request storage
        xCore.globalobjects.gmerequests[request.id] = request;
        
        //Process request
        ns_ajax.xmlHttpRequest(request.id, request.url, request.sync, request.method, request.postData, request.callback, request.callbackParams, request.success, request.tries);
    };
    
    ns_ajax.xmlHttpRequest = function(id ,url, sync, method, postData, callback, callbackParams, success, tries)
    {       
        var request = new XMLHttpRequest();
        request.id = id;
        request.url = url;
        request.success = success;
        request.sync = sync;
        request.tries = tries;
        request.method = method;
        request.postData = postData;
        request.handler = callback;
        request.callbackParams = callbackParams;
        //request.addEventListener("progress", updateProgress, false);        
        request.addEventListener("load", transactionComplete, false);        
        request.addEventListener("error", transferFailed, false);
        request.addEventListener("abort", transferCanceled, false);                

        request.onreadystatechange = function()
        {
            if(this.readyState === 4)
            {
                if(this.status === 200 && this.responseText !== null || this.status == 204){                                                                                
                    //Register parsed response                    
                    request.parsedResponse = JSON.parse(this.responseText); 
                    //Confirm successed response
                    request.success = true;                    
                    //Pass to callback
                    callback(request.parsedResponse,callbackParams); 

                }
                else if(this.status === 403) // forbitten
                {                                
                    if(tries < ns_ajax.tries){
                        tries = tries + 1;
                        window.setTimeout(function(){ns_ajax.xmlHttpRequest(id, url, sync, method, postData, callback, callbackParams, success, tries);}, ns_ajax.rate);                        
                    } else {
                        ns_interface.showAlert(this.statusText,this.responseText, true);   
                        hideLoader();
                    }
                } else if (this.status === 400 || this.status === 401){
                    ns_interface.showAlert(this.statusText,this.responseText, true);  
                    hideLoader();
                }            
            }
        };
        
        //Launch loader
        showLoader();
        //Send the actual request
        request.open(method, url, sync);
        request.setRequestHeader('Content-Type', 'application/json');                
        request.send(JSON.stringify(postData));        
            
        return request;       
    };
    
    ns_ajax.tinyRequest = function(url, sync, method, postData, callback, callbackParams)
    {                      
        var request = new XMLHttpRequest();
        request.onreadystatechange = function()
        {
            if(this.readyState === 4)
            {
                if(this.status === 200 && this.responseText !== null || this.status == 204){       
                    //parse
                    var parsedResponse = JSON.parse(this.responseText);                    
                    callback(parsedResponse,callbackParams); 
                    //hide loader
                    //hideLoader();
                }               
            }
        };
        
        //Launch loader
        //showLoader();
        
        //Send request
        request.open(method, url, sync);
        request.setRequestHeader('Content-Type', 'application/json');                 
        request.send();            
        return request;       
    };
    
    function transactionComplete(evt) {                 
        _log('COMPLETED ' +  evt.srcElement.url);        
        xCore.globalobjects.gmerequests[evt.srcElement.id] = evt.srcElement;
        //hide loader
        hideLoader();
    }
     
    function transferFailed(evt) {
      alert("The service requested reported an error.");
      hideLoader();
    }
    
     
    function transferCanceled(evt) {
      alert("The service request has been canceled by the user.");
      hideLoader();
    }   
}());

//Guid Generator
function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
}
    
function guid() {
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
}


function _log(message){
    console.log("@ " + new Date().getTime() + " ms ::::: " + message);
}

function showLoader(){
    xCore.globalobjects.requestCount++;
    document.getElementById('loader').removeAttribute('style');
}

function hideLoader(){
    xCore.globalobjects.requestCount--;
    
    if(xCore.globalobjects.requestCount === 0){
        document.getElementById('loader').setAttribute('style','display:none');    
    }
};