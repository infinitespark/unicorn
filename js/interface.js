//User interface
var ns_interface = {};

ns_interface.settings = xCore.modules.interface.settings;

ns_interface.buildAssetSelect = function(response){    
    var selectElement, goButton;
    if(response)
    {        
        xCore.globalobjects.assetCatalog = {};
        
        //SelectElement
        selectElement = document.getElementById("assetList");
        goButton = document.getElementById("goButton");
        
        if(selectElement.options && selectElement.options.length > 0 ){
                selectElement.options.length = 0;
        }
        
        var myOptions = document.createElement("option"); 
            myOptions.value = null;
            myOptions.innerHTML = "...";
            selectElement.appendChild(myOptions);
        
        var jsonKeys = Object.keys(response);
        for (var i = 0; i < jsonKeys.length; i++) {            
            for (var j = 0; j < response[jsonKeys[i]].length; j++){
                    //Create global object                    
                    response[jsonKeys[i]][j].type = jsonKeys[i];
                    xCore.globalobjects.assetCatalog[response[jsonKeys[i]][j].id] = response[jsonKeys[i]][j]; 
                    
                    //Populate asset list
                    myOptions = document.createElement("option");
                    myOptions.value = response[jsonKeys[i]][j].id;
                    myOptions.innerHTML = response[jsonKeys[i]][j].name;
                    selectElement.appendChild(myOptions);
                    
                    selectElement.removeAttribute("style");
                    goButton.removeAttribute("style");
            }    
        }        
    }
};

ns_interface.selectAsset = function(asset, params){    
    xCore.globalobjects.activeAsset = asset;
    if(params && params.type){
       xCore.globalobjects.activeAsset.type = params.type; 
    }
};

ns_interface.goAsset = function(){    
        
    var asset = xCore.globalobjects.activeAsset;  
    if(asset)
    {
        switch (asset.type) {
            case "maps":            
                ns_gmaps.addMapsEngineMap(asset);
                ns_gmaps.goToNewBounds(asset.bbox);            
                break;
            case "layers":
                ns_gmaps.addMapsEngineLayer(asset);
                ns_gmaps.goToNewBounds(asset.bbox);
                break; 
            case "tables":
                ns_catalog.buildForm(asset);
                break;             
                }  
    }
    else
    {
        //Error management!??
    }
};

ns_interface.buildLabel = function(layername, layerid){
    var aSpan = document.createElement("span");
    
    var aIcon = document.createElement("i");
    
        aSpan.id = layerid;
        aSpan.setAttribute("class","label label-success");
        
        var removeButton = document.createElement("a");
        removeButton.setAttribute("href","#");
        removeButton.setAttribute("onclick","ns_gmaps.removeMapsEngineLayer('" + layerid + "');");        
        aIcon.setAttribute("class","icon-remove icon-white");
        
        /*var hideButton = ...*/
        
   removeButton.appendChild(aIcon);
   aSpan.appendChild(removeButton);
   
   aSpan.innerHTML += "<span>" + layername + "</span><br>";
   
    return aSpan;
};

ns_interface.isLoggedIn = function(user){
  var loggedLabel = document.getElementById("userinfo");
  if(user){ //Logged in
    if(user.name){
      loggedLabel.innerHTML = "<a href='#' title='Sair' class='logout' onclick='ns_interface.logOut();'><i class='icon-user'></i></a>" + "&nbsp;" + user.name + " (" + user.family_name + ", " + user.given_name + ")"; 
    } else if(user.error) {
        ns_interface.showAlert("Error: ", user.error.message, false);
    }
  } else {
      loggedLabel.innerHTML = "<a href='#' class='btn btn-mini'>Entrar</a>";
  }
};

ns_interface.logOut = function(){
    $('userinfo').innerHTML = '';
    $('gmeconnection').innerHTML = '';
    var currentLocation = document.location.href.split('#')[0];
    document.location.href = "https://www.google.com/accounts/Logout?continue=https://appengine.google.com/_ah/logout?continue=" + currentLocation;
};

ns_interface.slideleft = function()
{
    //Define tab
    var tab = document.getElementById('lefttab');        
    tab.style['-webkit-transition'] = "left 1s";
    tab.style['-moz-transition'] = "left 1s";
    
    //Define main container
    var panel = document.getElementById('leftpanel');        
    panel.style['-webkit-transition'] = "left 1s";
    panel.style['-moz-transition'] = "left 1s";
    
    //Moves panel and tab 
    if(panel.style.left === '0px')
    {
        var panelNewLeft = parseInt(panel.style.left,0) - parseInt(panel.style.width,0);            
        panel.style.left = panelNewLeft + "px" ;
        tab.style.left =  '0px';
        ns_interface.leftpanel = false;
    }
    else
    {            
        panel.style.left = '0px';                        
        tab.style.left = parseInt(panel.style.width,0) + "px" ;
        ns_interface.leftpanel = true;
    }   
    
    //Changes Icon
    var icon = document.getElementById("lefticon");        
    if(icon.className === "icon-chevron-right")
        icon.className = "icon-chevron-left";
    else
        icon.className = "icon-chevron-right";
};

ns_interface.slidebottom = function()
{
    //Define tab
    var tab = document.getElementById('bottomtab');        
    tab.style['-webkit-transition'] = "bottom 1s";
    tab.style['-moz-transition'] = "bottom 1s";
    
    //Define main container
    var panel = document.getElementById('bottompanel');        
    panel.style['-webkit-transition'] = "bottom 1s";
    panel.style['-moz-transition'] = "bottom 1s";
    
    //Moves panel and tab
    if(panel.style.bottom === '0px')
    {
        var panelNewBottom = parseInt(panel.style.bottom,0) - parseInt(panel.style.height,0);            
        panel.style.bottom = panelNewBottom + "px" ;
        tab.style.bottom =  tab.style.height;
        ns_interface.bottompanel = false;
    }
    else
    {            
        panel.style.bottom = '0px';                        
        tab.style.bottom = parseInt(panel.style.height,0) + "px" ;
        ns_interface.bottompanel = true;
    }   
    
    //Changes Icon
    var icon = document.getElementById("bottomicon");        
    if(icon.className === "icon-chevron-up")
        icon.className = "icon-chevron-down";
    else
        icon.className = "icon-chevron-up";             
};

ns_interface.showAlert = function(statusText, responseText, parse){
  var messageDiv = document.getElementById("statusbar");
  messageDiv.className = "alert alert-error";
  var responseContent;
  
  if(parse){
      responseContent = JSON.parse(responseText);
      if(responseContent.error){          
          document.getElementById('statusmessage').innerHTML = statusText + ": " + responseContent.error.message;         
      }
  } else {
      responseContent = responseText;
      document.getElementById('statusmessage').innerHTML = statusText + ": " + responseContent; 
  }
  
  messageDiv.style.display = '';     
  setTimeout(function(){messageDiv.style.display = "none";},10000);
};

ns_interface.showNotifier = function(message){
  $(notifiermessage)[0].innerHTML = message;
  $(notifier)[0].style.display = '';
};

ns_interface.clearNotifier = function(){
  $(notifiermessage)[0].innerHTML = '';
  $(notifier)[0].style.display = 'none';
  if(xCore.globalobjects.overlays.tools){
        xCore.globalobjects.overlays.tools.setMap(null);
        google.maps.event.clearListeners(ns_gmaps.map, 'click');
    }
};

ns_interface.enableDisableButton = function(id, io)
{
    var btn = document.getElementById(id);
    if(btn)
    {
        if(io && btn.className.indexOf("disabled") > -1) //io = true, switch button ON            
        {
            btn.className = btn.className.split("disabled")[0];                
        }
        else if(!io && btn.className.indexOf("disabled") === -1)
        {
            btn.className = btn.className + " disabled";
        }
    }
};

ns_interface.buildThemeTree = function(){ 	
		xCore.globalobjects.themes = {};		           
		ns_gme.assets.list("maps", ns_interface.processMaps);  
};
			

ns_interface.processMaps = function (response){
	mapsFound = response.maps;	
	var comboBox = document.getElementById("themeSelect");
    
    //Empty option
    var firstoption = document.createElement("option");
    	firstoption.id = 0;
		firstoption.innerHTML = "...";	
        
    comboBox.appendChild(firstoption);

	for (var i = 0 ; i < mapsFound.length ; i++){
		//BackBone
		xCore.globalobjects.themes[mapsFound[i].id] = mapsFound[i];		
		xCore.globalobjects.themes[mapsFound[i].id].visibility = "off";
		xCore.globalobjects.themes[mapsFound[i].id].requested = false;
        xCore.globalobjects.themes[mapsFound[i].id].layers = {};
        xCore.globalobjects.themes[mapsFound[i].id].contents = [];
		//Interface
		var option = document.createElement("option");        
		    option.id = "op__" + mapsFound[i].id;
		    option.innerHTML = mapsFound[i].name;			
			
		comboBox.appendChild(option);	
	}
};

ns_interface.selectMap = function(){
  var selectList = document.getElementById('themeSelect');  
  var mapid = selectList.selectedOptions[0].id;
  
};

ns_interface.requestLayers = function(mapid){
	if(mapid){ 
	    if(mapid != 0){
	        mapid = mapid.split("__")[1];
    	    var aMap = xCore.globalobjects.themes[mapid];	
    		if(aMap && aMap.requested){                    			
                ns_interface.buildBranch(mapid, aMap.contents);            
    		} else {
    			ns_gme.assets.getByType('maps', mapid, ns_interface.processLayers);			
    		}
	    } else {
	        document.getElementById("layerList").innerHTML = '';
	    }
	}
};
	
ns_interface.processLayers = function(response){	
    if(response){ 
        
        if(xCore.settings.user.layerAutoGoto){
            ns_gmaps.goToNewBounds(response.bbox);
        }
        
        var mapid = response.id;
        var layersFound = response.contents;
        //Store map contents
        xCore.globalobjects.themes[mapid].contents = response.contents;
        if (layersFound && layersFound.length > 0){
		    xCore.globalobjects.themes[mapid].requested = true;
            
            for (var i = 0 ; i < layersFound.length ; i++){
                if(layersFound[i].type === "layer"){
                    ns_interface.registerLayer(mapid,layersFound[i]);
                }
                else if(layersFound[i].type === "folder" && layersFound[i].contents && layersFound[i].contents.length > 0 ) {
                    var aLayer  = layersFound[i];
                    for(var j = 0 ; j < aLayer.contents.length ; j++ ) {
                         ns_interface.registerLayer(mapid,aLayer.contents[j]);
                    }
                }
            }
        
        ns_interface.buildBranch(mapid, layersFound);
        
        }
    
    }
}; 

ns_interface.registerLayer = function (mapid, aLayer){
    xCore.globalobjects.themes[mapid].layers[aLayer.id] = aLayer;		
    xCore.globalobjects.themes[mapid].layers[aLayer.id].on = false;   
};

//Build Tree
ns_interface.buildBranch = function(mapid,layersFound){
    var layerList = document.getElementById("layerList");
	layerList.innerHTML = "";
			
	var layerNode = document.createElement("ul");
		layerNode.setAttribute("class","nav nav-pills nav-stacked");
		layerNode.id = "ul__" + mapid;
  
	for (var i = 0 ; i < layersFound.length ; i++){                			
		var newNode = document.createElement("li");
		    newNode.setAttribute("class","layerOff");
		    newNode.id = "li__" + mapid + "__" + i;
		
		if(layersFound[i].disabled){
		    newNode.setAttribute("class","layerDisabled");
		}
        else if(layersFound[i].on){
            newNode.setAttribute("class","layerOn");
        }
                        
        var newRef = document.createElement("a"); 
        //newRef.id = anId;
        newRef.id = 'a__' + mapid + "__" + i;
        newRef.setAttribute("mapid", mapid);
        newRef.setAttribute("nodeid", i);
        newRef.innerHTML = layersFound[i].name;
        if(!layersFound[i].disabled){
            newRef.setAttribute("href","#");
            newRef.setAttribute("onclick","ns_interface.viewLayer(this)");
        }
 
        newNode.appendChild(newRef);
		layerNode.appendChild(newNode);  
	}
	
	layerList.appendChild(layerNode);
};

ns_interface.viewLayer = function(node){
    if(node && node.id && node.attributes['mapid']){
        var aMap = xCore.globalobjects.themes[node.attributes['mapid'].value];
        var aTheme = aMap.contents[node.attributes['nodeid'].value];
        var someLayers = [];
        
        if (aTheme.type === 'folder') {
            for (var i = 0; i < aTheme.contents.length; i++) {
                someLayers.push(aTheme.contents[i]);    
            }
        } else {
            someLayers.push(aTheme);
        }
        
        for (var i = 0; i < someLayers.length; i++) {
            var aLayer = aMap.layers[someLayers[i].id];
            aLayer.mapid = node.attributes['mapid'].value;
            aLayer.themeid = node.attributes['nodeid'].value;
            
            if(aLayer){
                if(!aLayer.on){
                    ns_gmaps.addMapsEngineLayer(aLayer);                                               
                } else {
                    ns_gmaps.removeMapsEngineLayer(aLayer);                                            
                }            
            }   
        }
    }
};

ns_interface.setLayerOnOff = function(layer){
    
    var leaf = document.getElementById("li__" + layer.mapid + "__" + layer.themeid);
    if(layer.on){
      leaf.setAttribute("class","layerOn");
    } else {
      leaf.setAttribute("class","layerOff");
    }
    
};

ns_interface.disableLayer = function(layer){
    var li = document.getElementById("li__" + layer.mapid + "__" + layer.themeid);
    var a = document.getElementById("a__" + layer.mapid + "__" + layer.themeid);
    
    if(layer.disabled){
        a.removeAttribute('href');
        a.removeAttribute('onclick');
        li.setAttribute('class','layerDisabled');
    }
};

/**
 * END THEME TREE 
 **/


//INTERFACE COMPONENTS EVENT LISTENERS 
$("#layerGoto").click( function(){
   xCore.settings.user.layerAutoGoto = this.checked;
});

$('#themeSelect').change(function(){
   ns_interface.requestLayers($(this).find('option:selected').attr('id'));
});