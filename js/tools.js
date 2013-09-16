var isVisible = false;

function showHideTools(){
    var dToolbar = document.getElementById('drawingToolbar');
    if(dToolbar){
        if(!isVisible){
            dToolbar.removeAttribute('style');
        } else {
            dToolbar.setAttribute('style','display:none');
            ns_interface.clearNotifier();
        }
        isVisible = !isVisible;
    }
}

function geoLocation()
{
    if (navigator.geolocation){
        navigator.geolocation.getCurrentPosition(showPosition);
    }
    else{
        ns_interface.showAlert("Erro: ", "Geolocation is not supported by this browser!", false);
    }
}

function showPosition(position)
{
    ns_interface.clearNotifier();
    ns_interface.showNotifier("Lat: " + position.coords.latitude.toFixed(4) + " Lng: " + position.coords.longitude.toFixed(4));
    ns_gmaps.addSimpleMarker([position.coords.longitude,position.coords.latitude], "This is me!" ,"tools");
}

function drawPoint(){
    ns_interface.clearNotifier();
    xCore.globalobjects.overlays.tools = new google.maps.Marker({
        draggable: true
    });
    
    google.maps.event.addListener(ns_gmaps.map, 'click', function(event){
        var lat = event.latLng.lat();
        var lng = event.latLng.lng();
        xCore.globalobjects.overlays.tools.setPosition(event.latLng);
        xCore.globalobjects.overlays.tools.setMap(ns_gmaps.map);
        ns_interface.showNotifier("Lat: " + lat.toFixed(4) + " Lng: " + lng.toFixed(4));
        
    });
    
    google.maps.event.addListener(xCore.globalobjects.overlays.tools, 'dragend', function() {
        var newPosition =  xCore.globalobjects.overlays.tools.getPosition();
        ns_interface.showNotifier("Lat: " + newPosition.lat().toFixed(4) + " Lng: " + newPosition.lng().toFixed(4));
    });
}

function drawPolyline() {
    ns_interface.clearNotifier();
    xCore.globalobjects.overlays.tools = new google.maps.Polyline({
        strokeColor: "#ff0000",
        strokeOpacity: 0.6,
        strokeWeight: 2,
        editable: true,
    });
    
    xCore.globalobjects.overlays.tools.setMap(ns_gmaps.map);
    google.maps.event.addListener(ns_gmaps.map, 'click', addPoint);
    addDeleteButton(xCore.globalobjects.overlays.tools, 'img/delete_vertice.png');
}

function drawPolygon() {
    ns_interface.clearNotifier();
    xCore.globalobjects.overlays.tools = new google.maps.Polygon({
        strokeColor: '#ff0000',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#ff0000',
        editable: true,
        fillOpacity: 0.25
    });
    
    xCore.globalobjects.overlays.tools.setMap(ns_gmaps.map);
    google.maps.event.addListener(ns_gmaps.map, 'click', addPoint);
    addDeleteButton(xCore.globalobjects.overlays.tools, 'img/delete_vertice.png');
}

function addDeleteButton(poly, imageUrl) {
  var path = poly.getPath();
  path["btnDeleteClickHandler"] = {};
  path["btnDeleteImageUrl"] = imageUrl;
  
  google.maps.event.addListener(poly.getPath(),'set_at',editPoint);
  google.maps.event.addListener(poly.getPath(),'insert_at',editPoint);
}

function addPoint(e, type) {
    var vertices = xCore.globalobjects.overlays.tools.getPath();
    vertices.push(e.latLng);
}

function editPoint(index) {
    var path = this;
    var btnDelete = getDeleteButton(path.btnDeleteImageUrl);
    
    if(btnDelete.length === 0) 
    {
        var undoimg = $("img[src$='https://maps.gstatic.com/mapfiles/undo_poly.png']");
        undoimg.parent().css('height', '21px !important');
        undoimg.parent().parent().append('<div style="overflow-x: hidden; overflow-y: hidden; position: absolute; width: 30px; height: 27px;top:21px;"><img src="' + path.btnDeleteImageUrl + '" class="deletePoly" style="height:auto; width:auto; position: absolute; left:0;"/></div>');
        
        // now get that button back again!
        btnDelete = getDeleteButton(path.btnDeleteImageUrl);
        btnDelete.hover(function() { $(this).css('left', '-30px'); return false;}, 
                        function() { $(this).css('left', '0px'); return false;});
        btnDelete.mousedown(function() { $(this).css('left', '-60px'); return false;});
    }
    
    // if we've already attached a handler, remove it
    if(path.btnDeleteClickHandler) 
        btnDelete.unbind('click', path.btnDeleteClickHandler);
    
    // now add a handler for removing the passed in index
    path.btnDeleteClickHandler = function() {
        path.removeAt(index);
        getMeasures();
        return false;
    };
    
    btnDelete.click(path.btnDeleteClickHandler);
    
    getMeasures();
}

function getDeleteButton(imageUrl) {
  return  $("img[src$='" + imageUrl + "']");
}


function getMeasures(){
    var poly = xCore.globalobjects.overlays.tools;
    if(poly.fillColor){
        poly.area = google.maps.geometry.spherical.computeArea(poly.getPath());
        poly.distance = google.maps.geometry.spherical.computeLength(poly.getPath());
        ns_interface.showNotifier("A : " + Math.round(poly.area) + "m2  | " + "C : " + Math.round(poly.distance) + "m");  
    } else {
        poly.distance = google.maps.geometry.spherical.computeLength(poly.getPath());
        ns_interface.showNotifier("C : " + Math.round(poly.distance) + "m");  
    }
    
}

/*
ns_gmaps.drawRectangle = function(bbox)
{
   if(bbox)
   {
        if(ns_gmaps.rectangle)
        {
            ns_gmaps.rectangle.setMap(null) ;
        } 
        
        ns_gmaps.rectangle = new google.maps.Rectangle({
                    strokeColor: "#FF0000",
                    strokeOpacity: 0.2,
                    strokeWeight: 0.1,
                    fillColor: "#FF0000",
                    fillOpacity: 0.05,
                    map: ns_gmaps.map
                });
        
        var xy1 = new google.maps.LatLng(bbox[1] , bbox[0]);
        var xy2 = new google.maps.LatLng(bbox[3] , bbox[2]);            
        var latLngBounds = new google.maps.LatLngBounds(xy1,xy2);
        ns_gmaps.rectangle.setBounds(latLngBounds);
   }
};
*/
/*
ns_gmaps.rowToMap = function (tableId, data, schema, rowIndex) {    

    //InfoWindow
    var infoWindow;
    
    var dataId = tableId + "__" + data.guid;
    var geometryType;
    for(var i = 0 ; i < schema.columns.length ; i++)
    {
        if(schema.columns[i].name === schema.primaryGeometry){
        geometryType = schema.columns[i].type; //Point, Polyline or Polygon
        }
    }
    var coordinates;
    
    if(data.position){coordinates =  data.position} else {coordinates = data.latLngs}
    
    if(schema && schema.columns && schema.columns.length > 0 && data && data.geojsonProperties)
    {
        if(!ns_gmaps.overlays.Infowindows){ns_gmaps.overlays.Infowindows = {};}
            
        infoWindow = ns_gmaps.infoWindow(dataId, data, schema, geometryType);
    }    
    
    //Geometry
    if(coordinates)
    {        
        var tooltip = "DataRow: " + data.guid; //just for example        
        if(!ns_gmaps.overlays[geometryType])
        {
            ns_gmaps.overlays[geometryType] = {}; //If there was not a geometry group, create it
        }        
        
        //Draw geometry according to functions mapped in json [see overlays]  
        var overlayHandler = eval(ns_gmaps.settings.overlayObjects[geometryType].handler);        
        overlayHandler(dataId , geometryType , coordinates , tooltip, infoWindow);
    }
};
*/
