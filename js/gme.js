// Google maps engine methods
"use strict";
var ns_gme = {    
    
    settings : xCore.modules.gme.settings,
    
    searchstring: new Array(),
    
    request: function(url, includeProjectId, sync, method, postdata, callback, callbackParams)
    {                                
        //Register
        if(xCore.globalobjects && url && url != ""){
            xCore.globalobjects.activeRequest = {};
            xCore.globalobjects.activeRequest.success = false;
            xCore.globalobjects.activeRequest.tries = 0;
            xCore.globalobjects.activeRequest.method = method;
            xCore.globalobjects.activeRequest.callback = callback;
            xCore.globalobjects.activeRequest.callbackParams = callbackParams;
            
            
            xCore.globalobjects.activeRequest.url = ns_gme.settings.gmeBaseURL + url;
            xCore.globalobjects.activeRequest.url += (includeProjectId)? "&projectId=" + xCore.globalobjects.gme.project.id : "";
            xCore.globalobjects.activeRequest.url += "&access_token=" + session.oauthtoken;
            
            ns_ajax.queueRequest(xCore.globalobjects.activeRequest);         
        }                                                                 
    },            
    projects :
    {                   
        list: function()
        {            
            var url = "projects?";            
            ns_gme.request(url, false, false, "GET", null, ns_gme.projects.setup);
        },        
        setup : function(response) 
        {                  
                if(response.projects && response.projects.length > 0)
                {                
                    for (var i = 0; i < response.projects.length; i++) 
                    {                         
                        xCore.globalobjects.gme = {};
                        xCore.globalobjects.gme.project = response.projects[i];                        
                        document.getElementById("gmeconnection").innerHTML = "<i class='icon-thumbs-up' title='Connected to Google Maps Engine'></i>" + "&nbsp;" + xCore.globalobjects.gme.project.name;    
                    }
					ns_interface.buildThemeTree(); //Setup theme tree
                    //ns_interface.buildSearch(); //Setup advanced search interface. MOOVED INTO A NEW CLASS OF ITS OWN! Waiting for full text search devs                             
					ns_gme.projects.quicksearch(); //Setup search                    
                }                            
        },                
        quicksearch: function (response)
        {            
            if(response){
                if(response.features && response.features.length > 0){                                 
                    //var searchstring = [];
                    for(var i = 0 ; i < response.features.length ; i++){
                        if(response.features[i].properties){
                            ns_gme.searchstring.push({
                                'label':response.features[i].properties.nome,
                                'desc':response.features[i].properties.tipo_aproveitamento,
                                'geo':response.features[i].geometry,
                                'id':response.features[i].properties.URN
                            });
                        }
                    }
            
                    //For paging... 
                    //if(response.nextPageToken){
                      //  ns_gme.features.list("14681502266025613017-08615641808469135682", 1500, 1000, null, "DESCRICAO,geometry", "", ns_gme.projects.quicksearch);
                    //}
                   
                    $(quicksearch).autocomplete({
                        minLength: 1,
                        source: function(req, response) {
                            var re = $.ui.autocomplete.escapeRegex(req.term);
                            var matcher = new RegExp("^" + re, "i");
                            response($.grep(ns_gme.searchstring, function(item) {
                                var strparts = item.label.split(/[ ,]+/);
                                for(var i = 0 ; i < strparts.length ; i++){
                                    var isMatch = matcher.test(strparts[i]);
                                    if(isMatch){
                                        return isMatch;
                                    }
                                }
                            }));
                        },
                        select: function( event, ui ) {
                            $(quicksearch).val( ui.item.label );
                            ns_gmaps.addSimpleMarker (ui.item.geo.coordinates, ui.item.label + " (" + ui.item.desc + ")" , "quicksearch");
                        }
                    });
                }
            } else {        
                ns_gme.features.list("14681502266025613017-13149566016482163597", null, null, null, "nome,URN,tipo_aproveitamento,geometry", "", ns_gme.projects.quicksearch);
            } 
        }
    },    
    assets:
    {        
        get: function(asset, callback)
        {
            if(!asset.type) asset.type = "asset";                            
            var url =  asset.type + "/" + asset.id + "?";            
            ns_gme.request(url, true, false, "GET", null, callback, {"type":asset.type});
        },
        getByType: function(type, id, callback)
        {            
            var url =  type + "/" + id + "?";            
            ns_gme.request(url, true, false, "GET", null, callback, {"type":type});
        },
        list: function(assetType, callback)
        {
            if(!assetType) assetType = "assets";                        
            var url =  assetType + "?";
            ns_gme.request(url, true, false, "GET", null, callback);
        }
    },
    features:
    {
        request: function(url, callback)
        {            
            ns_gme.request(url, true, true, "GET", null, callback);
        },
        batchRequest: function(url, features, callback)
        {            
            ns_gme.request(url, true, true, "POST", features, callback);
        },
        list: function(id, limit, maxResults, pageToken, select, where, callback)
        {
            //select is a csv list of column names and where is a stringified SQL statement
            var url = "tables" + "/" + id + "/" + "features?";
            
            url += (limit)? "&limit=" + limit : "";
            url += (maxResults)? "&maxResults=" + maxResults : "";
            url += (pageToken)? "&pageToken=" + pageToken : "";
            url += (select)? "&select=" + select.toString() : "";
            url += (where)? "&where=" + where : "";
          
            this.request(url, callback);
        },
        batchInsert: function(id, features ,callback)
        {
            var url = "tables" + "/" + id + "/" + "features/batchInsert?";
            this.batchRequest(url, features, callback);
        },
        batchUpdate : function(id, features, callback)
        {
            var url = "tables" + "/" + id + "/" + "features/batchPatch?";
            this.batchRequest(url, features, callback);
        },
        batchDelete : function(id, featuresIds, callback)
        {
            var url = "tables" + "/" + id + "/" + "features/batchDelete?";
            this.batchRequest(url, featuresIds, callback);
        },
        toGeoJSON: function(features)
        {            
            xCore.globalobjects.activeFeatures = {};  
            
            if(features && features.length > 0 ){
                for (var i = 0 ; i < features.length ; i++){
                    var newGeoJsonObject = new GeoJSON(features[i]);
                    var newGUID = guid();
                    if(newGeoJsonObject){
                        newGeoJsonObject.guid = newGUID;
                        xCore.globalobjects.activeFeatures[newGUID] = newGeoJsonObject;        
                    }
                }                
            }                    
        }
    }
};