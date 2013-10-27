//Full app initialize
var session = {};   //Volatile
var xCore;

(function () {
    "use strict";
//Config load
    ns_ajax.tinyRequest("appconfig.json", false, "GET", null, function(response){    
        if(response){                               
            if(response.core)
            {
                 //Create core
                xCore = response.core;            
                //Load Modules                            
                if(response.modules && response.modules.length > 0){            
                    xCore.modules = {};                    
                    for(var i = 0 ; i < response.modules.length; i++){
                        xCore.modules[response.modules[i].source] = response.modules[i]; //Module created
                        if(response.modules[i].source){
                            var script = document.createElement("script");
                            script.type = "text/javascript";
                            script.src = "js/" + response.modules[i].source + ".js";    
                            document.head.appendChild(script);                               //Module loaded
                        }
                        console.log(response.modules[i].source + " loaded");
                    }
                }          
            }                                
        }
    },false
);

function initialize(){
    if(xCore && xCore.modules){   
        
        applicationSettings();                      //Detect browser, device, etc.
        
        ns_gmaps.mapInitiallize();                  //Google Maps API and Map SetUp  
        
        session.oauthtoken = oauth.login();         //Auth session                
        
        if(session.oauthtoken){                     // Google Maps Engine Setup;                 
            ns_gme.projects.list();                 //Fetch GME's projects	
        }
        
        ns_gmaps.setupPlaceSearch();                //Roteiro (Google places autocomplete widget)
    }
}


function applicationSettings(){
    detectBrowser();
}

function detectBrowser(){
    
    if (/MSIE (\d+\.\d+);/.test(navigator.userAgent)){
        xCore.settings.application.browser.ie = true;
        xCore.settings.application.browser.name = "ie";  
    } else if (/Firefox[\/\s](\d+\.\d+)/.test(navigator.userAgent)){
        xCore.settings.application.browser.name = "ff";  
    } else if (/Opera[\/\s](\d+\.\d+)/.test(navigator.userAgent)){
        xCore.settings.application.browser.name = "ff";  
    } else if (/Chrome[\/\s](\d+\.\d+)/.test(navigator.userAgent)){
        xCore.settings.application.browser.name = "cr";  
    } else if (/Safari[\/\s](\d+\.\d+)/.test(navigator.userAgent)){
        xCore.settings.application.browser.name = "ff";  
    } else {
        xCore.settings.application.browser.name = "other";  
    }
    
    xCore.settings.application.browser.full = navigator;
}


window.onload = initialize;

}());