//Editor builder
var ns_catalog = {};

(function () {
    "use strict";

ns_catalog.buildForm = function (asset)
{                            
    var aForm = document.createElement("form");
    aForm.id = "__searchform__" + asset.id;
    
    //WINDOW TITLE
    var aFieldset = document.createElement("fieldset");        
    var aLegend = document.createElement("legend");
    aLegend.innerHTML = "search " + asset.name;
    
    //Schema
    var columns = asset.schema.columns;
    var geometryName = asset.schema.primaryGeometry;
    for (var i = 0; i < columns.length; i++) 
    {
        var label;
        var inputField;
        
        if(columns[i].name !== geometryName)
        {     
            label = document.createElement("label");
            inputField = document.createElement("input");
            label.innerHTML = columns[i].name;                                    
            inputField.setAttribute("name","inputFields");
            inputField.setAttribute("id", aForm.id + "__" + columns[i].name);
            inputField.setAttribute("type","text");            
            inputField.setAttribute("placeholder",columns[i].type);                            
        }
         
        if(label) 
            aFieldset.appendChild(label);
            
        if(inputField)            
            aFieldset.appendChild(inputField);   
    }
         
    var submitBtn = document.createElement("a");
    submitBtn.id = "submitbtn";
    submitBtn.setAttribute("href","#");        
    submitBtn.setAttribute("class","btn btn-primary");    
    submitBtn.innerHTML = "Search";
    submitBtn.onclick = function()
    {                                     
        var whereString = "";
        for (var i = 0; i < columns.length; i++) 
        {                               
            var inputField = document.getElementById(aForm.id + "__" + columns[i].name);
            if (inputField && inputField.value !== "")
            {                
                whereString += columns[i].name + "='" + inputField.value + "'OR";
            }
        }
        whereString = encodeURIComponent(whereString.substring(0, whereString.length -2));                        
        ns_gme.features.list(asset.id, 10, 10, null, null, whereString, ns_catalog.processSearchResponse);
    };
    
    aForm.appendChild(aLegend);  
    aForm.appendChild(aFieldset);     
    aForm.appendChild(submitBtn);
         
    //return aForm;
    
    var assetSearch = document.getElementById("assetSearch");
        assetSearch.innerHTML = "";
        assetSearch.appendChild(aForm);        
        assetSearch.removeAttribute("style");
};


ns_catalog.processSearchResponse = function(response){    
    if(response && response.features && response.features.length > 0){
        //Convert features to GeoJSON and set a global object with them
        ns_gme.features.toGeoJSON(response.features);
        var schema = xCore.globalobjects.activeAsset.schema;
        var objectId = xCore.globalobjects.activeAsset.id;
        var features = xCore.globalobjects.activeFeatures;        
        ns_datatable.buildDataTable(objectId, "table", schema, features);
        ns_interface.slidebottom();
    }
};

ns_catalog.goFastSearch = function(callback){
    var searchInput = document.getElementById("fastsearch");
    var availableTags = xCore.globalobjects.basesearch;
};

}());