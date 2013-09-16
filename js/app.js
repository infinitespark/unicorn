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
                        var script = document.createElement("script");
                        script.type = "text/javascript";
                        script.src = "js/" + response.modules[i].source + ".js";    
                        document.head.appendChild(script);                               //Module loaded
                        console.log(response.modules[i].source + " loaded");
                    }
                }          
            }                                
        }
    },false
);

function initialize(){
    if(xCore && xCore.modules){        
        ns_gmaps.mapInitiallize(); //Google Maps API and Map SetUp  
        
        session.oauthtoken = oauth.login();//Auth session                
        
        if(session.oauthtoken){ // Google Maps Engine Setup;                 
            ns_gme.projects.list(); //Fetch GME's projects	
        }
        
        ns_gmaps.setupPlaceSearch(); //Roteiro (Google places autocomplete widget)
    }
}

window.onload = initialize;

}());