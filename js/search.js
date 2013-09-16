/**
 * ADVANCED SEARCH 
 
ns_interface.buildSearch = function(response, request){
    xCore.globalobjects.search = {};
    if(response){
        if(response.tables){
            var comboBox = document.getElementById("tableList");
            var tablesFound = response.tables;
            xCore.globalobjects.tables = {};
            for (var i = 0 ; i < tablesFound.length ; i++){
                xCore.globalobjects.tables[tablesFound[i].id] = {};
                xCore.globalobjects.tables[tablesFound[i].id].name = tablesFound[i].name;
               
                var option = document.createElement("option");
    			option.id = tablesFound[i].id;
    			option.innerHTML = tablesFound[i].name;			
    		
    	        comboBox.appendChild(option);	 
            }
        }
    } else {
        ns_gme.assets.list("tables", ns_interface.buildSearch);
    }
};

ns_interface.getTable = function(response){
    xCore.globalobjects.search.activetable = {}
    xCore.globalobjects.search.activetable.id  = document.getElementById("tableList").selectedOptions.item().id;
    if(response){
        if(response.schema){
            xCore.globalobjects.search.activetable = response;  
        }      
    } else {       
        if(xCore.globalobjects.search.activetable.id){
            ns_gme.assets.getByType("tables", xCore.globalobjects.search.activetable.id, ns_interface.getTable);               
        }
    }
};

ns_interface.search = function(response){
    var tableId = xCore.globalobjects.search.activetable.id; 
    if(response){
        if(response.features){
            //Has to check for token, requery and gather results to send to interface                
            xCore.globalobjects.search.results = response;
            ns_interface.buildResultList();
        }
    } else {
        var inputText = encodeURIComponent(document.getElementById('searchinput').value);
        var columns = xCore.globalobjects.search.activetable.schema.columns;
        var whereString = "";
        for (var i = 0; i < columns.length; i++) 
        {                                                         
            if(columns[i].type === "string" && columns[i].name !== "gx_id"){
                whereString += columns[i].name + "='" + inputText + "' OR ";
            }
        }
        whereString = encodeURIComponent(whereString.substring(0, whereString.length -3));                        
        ns_gme.features.list(tableId, 100, 100, null, null, whereString, ns_interface.search);    
    }
};

ns_interface.buildResultList = function(){
    var resultList = document.getElementById('results');
    var queryResponse = xCore.globalobjects.search.results;    
    if(queryResponse && queryResponse.features && queryResponse.features.length > 0 ){
        resultList.innerHTML = "";
        var tableQueried =  xCore.globalobjects.search.activetable;
        var resultFeatures = queryResponse.features;
            
            //ns_datatable.buildDataTable(tableQueried.id, "table", tableQueried.schema, resultFeatures);
            //ns_interface.slidebottom();
            
        
        for (var i = 0; i < resultFeatures.length; i++) {
            var resultLabel = ns_interface.buildResulLabel(resultFeatures[i]);
            resultList.appendChild(resultLabel);
        }
        document.getElementById('resultsPanel').removeAttribute('style');
        document.getElementById('resultsPanel').setAttribute('style','y-overflow:auto');        
    }        
};

ns_interface.buildResulLabel = function(feature){
    var aSpan = document.createElement("span");
        aSpan.id = feature.id;
        aSpan.setAttribute("class","label label-success");
    
    var aIcon = document.createElement("i");
        aIcon.setAttribute("class","icon-map-marker icon-white");
        
        
    var aButton = document.createElement("a");
        aButton.setAttribute("href","#");
        aButton.setAttribute("onclick","ns_gmaps.drawGeoJSON(" + feature.geometry + ");");        
        aButton.appendChild(aIcon);
        aSpan.appendChild(aButton);
        
        var fields = Object.keys(feature.properties);
        for (var i = 0; i < 1; i++) {
            aSpan.innerHTML += "<span>" + fields[i] + ": " + feature.properties[fields[i]] + "</span>";            
        }
       
    return aSpan;
};

ns_interface.cleanResultList = function(){
  //Clean the results
  document.getElementById('results').innerHTML = '';
  //Hide panel
  document.getElementById('resultsPanel').style='display:none';  
};

 /**
 * END ADVANCED SEARCH 
 **/
 
            