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
xCore.globalobjects.overlays.quicksearch = {};


ns_gmaps.mapInitiallize = function()
{
    google.maps.visualRefresh = false;
    
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
    
    ns_gmaps.map = new google.maps.Map(document.getElementById("map-canvas"),mapOptions);
    
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
                map: ns_gmaps.map,            
                accessToken: session.oauthtoken,
                suppressInfoWindows: true
            });
            
            //Listener : force goto viewport
            google.maps.event.addListener(mapsEngineLayer, 'bounds_changed', function() {
                if(xCore.settings.user.layerAutoGoto){
                    ns_gmaps.map.fitBounds(mapsEngineLayer.get('bounds'));
                }
            });
            
            //Listener : Return layer status
            google.maps.event.addListener(mapsEngineLayer, 'status_changed', function() {
                if(mapsEngineLayer.status !== "OK"){
                    ns_interface.showAlert("MapsEngineLayer Class" , "The layer <i>'" + layer.name + "'</i> could not be loaded sucessufuly and it will be disabled!", false );  
                    ns_interface.disableLayer(layer.id);
                } else {
                    ns_interface.setLayerOnOff(layer.id, true);
                }
                hideLoader();
            });
            
            //Infowindow
            var aInfowindow = new google.maps.InfoWindow({});
            
            //Listener: Click on layer
            google.maps.event.addListener(mapsEngineLayer, 'click', function(event){
                if(event){
                    aInfowindow.setPosition(event.latLng);
                    aInfowindow.setContent(ns_gmaps.newInfowindowBody(event.infoWindowHtml));
                    aInfowindow.open(ns_gmaps.map);
                }   
            });
            
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
    /* GSS CONNECTION
    var fullBody;
    var aTag = "urn____";	
	var aux1 = someHtml.substring(someHtml.indexOf(aTag) + aTag.length);
	var aux2 = aux1.substring(aux1.indexOf("\"") + "\"".length);
	var aURN = aux2.substr(0, aux2.indexOf("\""));

    someHtml += "<div id='editorToolbar'><a alt='Ver mais...' href='#' onclick=\"ns_gss.getObjectInfo('" + aURN + "', '"+ aTag + "');\"><button class='btn btn-primary' style='width:100%;' type='button'><i class='icon-plus icon-white'></i></button></a></div>";
    */
    var aInfowindow = $(someHtml)[0];
    aInfowindow.id = 'myinfowindowid';
    var aInfowindowcontent = aInfowindow.getElementsByClassName("infowindowbody")[0];
    aInfowindowcontent.style.maxHeight = document.height / 2 - 10 + "px";
    var aTable = aInfowindowcontent.getElementsByTagName("table")[0];
    aTable.className = "table table-striped";
    
    var toolbar = $("<div class='infowindowtoolbar'><button class='btn btn-mini' type='button' title='Saber mais...'><i class='icon-plus'></i></button></div>")[0];
    aInfowindow.appendChild(toolbar);

    return aInfowindow;
};

ns_gmaps.removeMapsEngineLayer = function (id)
{
    //Remove from map
    xCore.globalobjects.overlays.gme[id].setMap(null);
    
    //Set tree element off
    ns_interface.setLayerOnOff(id, false);
    
    //remove from global object
    if(xCore.globalobjects.overlays.gme[id]){        
        delete xCore.globalobjects.overlays.gme[id];
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
        //Only one marker per quicksearch
        if (xCore.globalobjects.overlays[overlay]) {
            xCore.globalobjects.overlays[overlay].setMap(null);
        }
        
        xCore.globalobjects.overlays[overlay] = new google.maps.Marker({
            position : new google.maps.LatLng(coords[1] , coords[0]),
            map: ns_gmaps.map,
            title:tooltip,
            draggable:false
        });
        
        ns_gmaps.map.setCenter(xCore.globalobjects.overlays[overlay].getPosition());
        ns_gmaps.map.setZoom(15);
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
       overlay.setMap(null);
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
  xCore.globalobjects.overlays.placesearch = new google.maps.Marker({
    map: ns_gmaps.map
  });
  
  google.maps.event.addListener(autocomplete, 'place_changed', function() {
        infowindow.close();
        xCore.globalobjects.overlays.placesearch.setVisible(false);
        input.className = '';
        var place = autocomplete.getPlace();
        if (!place.geometry) {
          // Inform the user that the place was not found and return.
          input.className = 'notfound';
          return;
        }
        
        // If the place has a geometry, then present it on a map.
        if (place.geometry.viewport) {
          ns_gmaps.map.fitBounds(place.geometry.viewport);
        } else {
          ns_gmaps.map.setCenter(place.geometry.location);
          ns_gmaps.map.setZoom(17);  // Why 17? Because it looks good.
        }

        xCore.globalobjects.overlays.placesearch.setPosition(place.geometry.location);
        xCore.globalobjects.overlays.placesearch.setVisible(true);
        
        var address = '';
        if (place.address_components) {
          address = [
            (place.address_components[0] && place.address_components[0].short_name || ''),
            (place.address_components[1] && place.address_components[1].short_name || ''),
            (place.address_components[2] && place.address_components[2].short_name || '')
          ].join(' ');
        }
        
        infowindow.setContent('<div><strong>' + place.name + '</strong><br>' + address);
        infowindow.open(ns_gmaps.map, xCore.globalobjects.overlays.placesearch);
  });
};

ns_gmaps.goHome = function(){
    ns_gmaps.map.setCenter(new google.maps.LatLng(ns_gmaps.settings.centerlng,ns_gmaps.settings.centerlat));
    ns_gmaps.map.setZoom(ns_gmaps.settings.zoom);
};

}());
