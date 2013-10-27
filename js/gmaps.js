// Google Maps API methods
var ns_gmaps = {};

(function () {
    "use strict";
    
ns_gmaps.settings = xCore.modules.gmaps.settings; 
ns_gmaps.map = null;

//Let's just define all overlay types here!
xCore.globalobjects.overlays = {};
xCore.globalobjects.overlays.gme = {};
xCore.globalobjects.overlays.placesearch = [];
xCore.globalobjects.overlays.quicksearch = [];
xCore.globalobjects.overlays.infowindows = {'active' : 0 , 'ids' : [] ,'objs' : { } };


ns_gmaps.mapInitiallize = function()
{
    var styles = ns_gmaps.settings.styledMap;    
    var mapOptions = 
    {
        center: new google.maps.LatLng(ns_gmaps.settings.centerlng,ns_gmaps.settings.centerlat),
        zoom: ns_gmaps.settings.zoom,
        mapTypeId: google.maps.MapTypeId.ROADMAP,        
        panControl: true,
        overviewMapControl: true,
        mapTypeControlOptions: 
        {
            mapTypeIds: ['Styled', google.maps.MapTypeId.SATELLITE]
        },
        panControlOptions: 
        {
            position: google.maps.ControlPosition.RIGHT_TOP
        },    
        zoomControl: true,
        zoomControlOptions: 
        {
            style: google.maps.ZoomControlStyle.LARGE,
            position: google.maps.ControlPosition.RIGHT_TOP
        }
    };
    
    ns_gmaps.map = new google.maps.Map(document.getElementById("map_canvas"),mapOptions);
    
    var mapType = new google.maps.StyledMapType(styles, { name:"Mapa" });    
    
    ns_gmaps.map.mapTypes.set('Styled', mapType);
    ns_gmaps.map.setMapTypeId('Styled');    
};

ns_gmaps.addMapsEngineMap = function (map)
{
    var layers = map.contents;
    var mapsEngineLayer;
    
    if(layers && layers.length > 0)
    {
        for (var i = 0; i < layers.length; i++){
          //ns_gmaps.addMapsEngineLayer(layers[i]);
            mapsEngineLayer = new google.maps.visualization.MapsEngineLayer({
            mapId: map.id,   
            layerKey: layers[i].key,
            map: ns_gmaps.map,            
            accessToken: session.oauthtoken
          });
        }
                
        xCore.globalobjects.overlays.gme[mapsEngineLayer.mapId] = mapsEngineLayer;
    }  
};

ns_gmaps.addMapsEngineLayer = function (layer)
{
    showLoader();
    var mapsEngineLayer;
    if(layer)
    {  
        if(layer.type === "layer"){
            if(!xCore.globalobjects.overlays.gme[layer.id]){
                mapsEngineLayer = new google.maps.visualization.MapsEngineLayer({
                    layerId: layer.id,
                    mapid: layer.mapid,
                    themeid: layer.themeid,
                    map: ns_gmaps.map,            
                    accessToken: session.oauthtoken,
                    suppressInfoWindows: true
                });
            
            //Event Listener : force goto viewport
            google.maps.event.addListener(mapsEngineLayer, 'bounds_changed', function() {
                if(xCore.settings.user.layerAutoGoto){
                    ns_gmaps.map.fitBounds(mapsEngineLayer.get('bounds'));
                }
            });
            
            //Event Listener : Return layer status
            google.maps.event.addListener(mapsEngineLayer, 'status_changed', function() {
                if(mapsEngineLayer.status !== "OK"){
                    layer.disabled = true;
                    ns_interface.showAlert("MapsEngineLayer Class" , "The layer <i>'" + layer.name + "'</i> could not be loaded sucessufuly and it will be disabled!", false );  
                    ns_interface.disableLayer(layer);
                } else {
                    layer.on = true;
                    ns_interface.setLayerOnOff(layer);
                }
                hideLoader();
            });
            
            //Infowindow
            var aInfowindow = new google.maps.InfoWindow({});
            
            //Event listener: Click on layer ... open Infowindow
            google.maps.event.addListener(mapsEngineLayer, 'click', function(event){
                if(event){
                    aInfowindow.setPosition(event.latLng);
                    aInfowindow.setContent(ns_gmaps.newInfowindowBody(event.infoWindowHtml));
                    aInfowindow.id = guid();
                    aInfowindow.open(ns_gmaps.map);
                    
                    //Register Infowindow
                    xCore.globalobjects.overlays.infowindows.active = aInfowindow.id;
                    xCore.globalobjects.overlays.infowindows.ids.push(aInfowindow.id);
                    xCore.globalobjects.overlays.infowindows.objs[aInfowindow.id] = aInfowindow;
                }   
            });
            
            //Event listener: Close Infowindow
            google.maps.event.addListener(aInfowindow,'closeclick',function(event){
                var infowindowids = xCore.globalobjects.overlays.infowindows.ids;
                for (var i = 0; i < infowindowids.length; i++) {
                    if(infowindowids[i] === aInfowindow.id){
                       infowindowids.splice(i,1);
                    }
                }
                delete xCore.globalobjects.overlays.infowindows.objs[aInfowindow.id]
            });
            
            //Event Listener: Infowindow placed in DOM
            google.maps.event.addListener(aInfowindow, 'domready', function(){
               
            }); 
            
            xCore.globalobjects.overlays.gme[mapsEngineLayer.layerId] = mapsEngineLayer;
            }
        } 
        else {
            if(layer.type === "folder" && layer.contents){
                for (var i = 0 ; i < layer.contents.length ; i++){
                   ns_gmaps.addMapsEngineLayer(layer.contents[i], layer.id); 
                }
            }
            else {
                ns_interface.showAlert("??","The layer or folder didn't seem to have any content!",false);
            }
        }
    }
};

ns_gmaps.newInfowindowBody = function(someHtml){
    var aInfowindow = document.createElement('div');
    aInfowindow.innerHTML = someHtml;
    
    var gssConnect = false;
    var gssKey;
    var infowindowUrn;

    if(aInfowindow.getElementsByClassName('urn').length > 0){
        infowindowUrn = aInfowindow.getElementsByClassName('urn')[0];
        gssKey = infowindowUrn.innerText;
        aInfowindow.id = "iw__" + gssKey;
        infowindowUrn.id = aInfowindow.id + '__urn';
        gssConnect = true;
    } else {
        aInfowindow.id = "iw__" + guid();
    }
    
    var infowindowTitle;
    if (aInfowindow.getElementsByClassName('infowindowtitle').length > 0) {
        infowindowTitle = aInfowindow.getElementsByClassName('infowindowtitle')[0];
        infowindowTitle.id = aInfowindow.id + '__title';
    }
    
    var infowindowBody;
    if(aInfowindow.getElementsByClassName('infowindowbody').length > 0){
        infowindowBody = aInfowindow.getElementsByClassName("infowindowbody")[0];
        infowindowBody.id = aInfowindow.id + "__body";
        
        var aTable;
        if(infowindowBody.getElementsByTagName("table").length > 0){
            aTable = infowindowBody.getElementsByTagName("table")[0];
            aTable.id = "gmedetails";
            aTable.className = "table table-striped";
        }
    } else {
        infowindowBody = aInfowindow;
    }
    
    if (gssConnect && gssKey) {
        var toolbarDiv= document.createElement('div');
            toolbarDiv.id = aInfowindow.id + "__toolbar";
            toolbarDiv.setAttribute('class','infowindowtoolbar');
            
        var gssButton = document.createElement('button');
            gssButton.id = aInfowindow.id + '__gssbutton';
            gssButton.setAttribute('class','btn btn-mini');
            gssButton.setAttribute('type','button');
            gssButton.setAttribute('title','Saber mais...');
            gssButton.setAttribute('onclick',"ns_gss.native.request('object_info', 'info', { 'objects': '" + gssKey + "' , 'return_info' : 'description' }, ns_gss.editor.compose)");
            
        var gssIcon = document.createElement('i');
            gssIcon.setAttribute('class','icon-plus');
            
        gssButton.appendChild(gssIcon);
        toolbarDiv.appendChild(gssButton);
        aInfowindow.appendChild(toolbarDiv);
    }
    
    infowindowBody.style.maxHeight = document.height / 2 - 20 + "px";
    return aInfowindow;
};

ns_gmaps.removeMapsEngineLayer = function (layer)
{
    //Remove from map
    xCore.globalobjects.overlays.gme[layer.id].setMap(null);
    
    //Set tree element off
    layer.on = false;
    ns_interface.setLayerOnOff(layer);
    
    //remove from global object
    if(xCore.globalobjects.overlays.gme[layer.id]){        
        delete xCore.globalobjects.overlays.gme[layer.id];
    }    
};

ns_gmaps.goToNewBounds = function (bbox)
{
    if(bbox)
   {
        var xy1 = new google.maps.LatLng(bbox[1] , bbox[0]);
        var xy2 = new google.maps.LatLng(bbox[3] , bbox[2]);                    
        ns_gmaps.map.fitBounds(new google.maps.LatLngBounds(xy1,xy2));    
   }
};

ns_gmaps.addMarker = function(dataId , geomType, coords, tooltip, infoWindow)
{       
    if(coords)
    {   
        xCore.globalobjects.overlays[geomType][dataId] = new google.maps.Marker({
            id:dataId,
            position: new google.maps.LatLng(coords.lat(),coords.lng()),
            map: ns_gmaps.map,
            title:tooltip,
            draggable:false
        });
        
        google.maps.event.addListener(xCore.globalobjects.overlays[geomType][dataId], 'click', function() {
            xCore.globalobjects.overlays.Infowindows[dataId].open(ns_gmaps.map , xCore.globalobjects.overlays[geomType][dataId]);
        });
                
        ns_gmaps.map.setCenter(xCore.globalobjects.overlays[geomType][dataId].getPosition());
    }
};

ns_gmaps.addSimpleMarker = function(coords, tooltip, overlay)
{       
    if(coords)
    {   
        var newSimpleMarker = new google.maps.Marker({
            id: guid(),
            position : new google.maps.LatLng(coords[1] , coords[0]),
            map: ns_gmaps.map,
            title:tooltip,
            draggable:false
        });
    
        if(xCore.settings.user.layerAutoGoto){
            ns_gmaps.map.setCenter(newSimpleMarker.getPosition());
            ns_gmaps.map.setZoom(15);    
        }
        
        xCore.globalobjects.overlays[overlay].push(newSimpleMarker);
    }
};

ns_gmaps.changePin = function(aColor)
{
    var pinColor = aColor;
    var pinUrl = "http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|";
    var pinImage = new google.maps.MarkerImage(pinUrl + pinColor,
            new google.maps.Size(21, 34),
            new google.maps.Point(0,0),
            new google.maps.Point(10, 34));
            
    return pinImage;            
};

ns_gmaps.drawPolyline = function(dataId , geomType, coords, tooltip, infoWindow)
{    
    if(coords)
    {
        var polylines = [];
        var bounds = new google.maps.LatLngBounds();
        for (var i = 0; i < coords.getArray().length; i++) {
            var polyline = [];
            var nextCoords = coords.getArray()[i].getArray();
            for (var j = 0; j < nextCoords.length; j++) {
                var newCoord = new google.maps.LatLng(nextCoords[j].lat(),nextCoords[j].lng()); 
                polyline.push(newCoord);
                bounds.extend(newCoord);
            }
            polylines.push(polyline);                
        }
        
        for (var i = 0; i < polylines.length; i++) {
            xCore.globalobjects.overlays[geomType][dataId] = new google.maps.Polyline({
                path: polylines[i],
                strokeColor: "#FF0000",
                strokeOpacity: 1.0,
                strokeWeight: 2,
                title:tooltip,
                editable:true,
                draggable: true,
                geodesic: true,
                map: ns_gmaps.map
            });
        
            google.maps.event.addListener(xCore.globalobjects.overlays[geomType][dataId], 'click', function() {
                if(google.maps.geometry.poly.containsLocation(event.latLng, xCore.globalobjects.overlays[geomType][dataId]) === true) 
                {
                    xCore.globalobjects.overlays.Infowindows[dataId].setPosition(event.latLng);
                    xCore.globalobjects.overlays.Infowindows[dataId].open(ns_gmaps.map);                    
                }        
            });    
        }
        
        ns_gmaps.map.fitBounds(bounds);        
    }        
};

ns_gmaps.drawPolygon = function(dataId , geomType, coords, tooltip, infoWindow)
{
    if(coords)
    {
        var polygons = [];
        var bounds = new google.maps.LatLngBounds();        
        for (var i = 0; i < coords.getArray().length; i++) {
            var polygon = [];
            var nextCoords = coords.getArray()[i].getArray(); 
            for (var j = 0; j < nextCoords.length; j++) {
                var newCoord = new google.maps.LatLng(nextCoords[j].lat(),nextCoords[j].lng()); 
                polygon.push(newCoord);
                bounds.extend(newCoord);
            }
            polygons.push(polygon);                
        }
        
        for (var i = 0; i < polygons.length; i++) {
            xCore.globalobjects.overlays[geomType][dataId] = new google.maps.Polygon({
                paths: polygons[i],
                strokeColor: "#FF0000",
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: "#FF0000",
                fillOpacity: 0.35,
                title:tooltip,
                editable:true,
                draggable: true,
                geodesic: true,
                map: ns_gmaps.map
            });
          
            google.maps.event.addListener(xCore.globalobjects.overlays[geomType][dataId], 'click', function(event) {                            
                if(google.maps.geometry.poly.containsLocation(event.latLng, xCore.globalobjects.overlays[geomType][dataId]) === true) 
                {
                    xCore.globalobjects.overlays.Infowindows[dataId].setPosition(event.latLng);
                    xCore.globalobjects.overlays.Infowindows[dataId].open(ns_gmaps.map);                    
                }             
            });
        }                
        ns_gmaps.map.fitBounds(bounds);
    }
};

ns_gmaps.infoWindow = function(dataId, data, schema, geometryType){

    var divWrapper = document.createElement("div");
    divWrapper.id= "editorwrapper";
    divWrapper.appendChild(ns_editor.buildForm(dataId, data , schema, geometryType));             
    xCore.globalobjects.overlays.Infowindows[dataId] = new google.maps.InfoWindow({
        content: divWrapper,
        shadow:null
    });   
};

ns_gmaps.getBoundsForPoly = function (poly) 
{
  var bounds = new google.maps.LatLngBounds;  
  poly.getPath().forEach(function(latLng) {
    bounds.extend(latLng);
  });
  return bounds;
};

ns_gmaps.clearOverlay = function(anOverlay)
{   
   var overlay = xCore.globalobjects.overlays[anOverlay];
   if(overlay){
       for (var i = 0; i < overlay.length; i++) {
           overlay[i].setMap(null);
       }

       var inputField = document.getElementById(anOverlay);
       if(inputField){
           inputField.value = '';
       }
   }
};

ns_gmaps.drawGeoJSON = function(geoJson){
    
    var options = {
        strokeColor: "#FFFF00",
        strokeWeight: 7,
        strokeOpacity: 0.75
    };

    var googleVector = new GeoJSON(geoJson.geometry, options);
    googleVector.setMap(ns_gmaps.map);    
};

ns_gmaps.setupPlaceSearch = function(){
  
  var input = (document.getElementById('placesearch'));
  var autocomplete = new google.maps.places.Autocomplete(input);
  autocomplete.bindTo('bounds', ns_gmaps.map);
  
  var infowindow = new google.maps.InfoWindow();
  
  var newPlaceSearch = new google.maps.Marker({
    map: ns_gmaps.map
  });
  
  google.maps.event.addListener(autocomplete, 'place_changed', function() {
        infowindow.close();
        newPlaceSearch.setVisible(false);
        input.className = '';
        var place = autocomplete.getPlace();
        if (!place.geometry) {
          // Inform the user that the place was not found and return.
          input.className = 'notfound';
          return;
        }
        
        // If the place has a geometry and user wants to go to, then present it on a map.
        
        if(xCore.settings.user.layerAutoGoto){
            if (place.geometry.viewport) {
              ns_gmaps.map.fitBounds(place.geometry.viewport);
            } else {
              ns_gmaps.map.setCenter(place.geometry.location);
              ns_gmaps.map.setZoom(17);  // Why 17? Because it looks good.
            }
        }
        
        newPlaceSearch.setPosition(place.geometry.location);
        newPlaceSearch.setVisible(true);
        
        var address = '';
        if (place.address_components) {
          address = [
            (place.address_components[0] && place.address_components[0].short_name || ''),
            (place.address_components[1] && place.address_components[1].short_name || ''),
            (place.address_components[2] && place.address_components[2].short_name || '')
          ].join(' ');
        }
        
        infowindow.setContent('<div><strong>' + place.name + '</strong><br>' + address);
        infowindow.open(ns_gmaps.map, newPlaceSearch);
        
        xCore.globalobjects.overlays.placesearch.push(newPlaceSearch);
  });
};

ns_gmaps.goHome = function(){
    ns_gmaps.map.setCenter(new google.maps.LatLng(ns_gmaps.settings.centerlng,ns_gmaps.settings.centerlat));
    ns_gmaps.map.setZoom(ns_gmaps.settings.zoom);
};

}());
