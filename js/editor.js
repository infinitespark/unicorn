//Editor builder
var ns_editor = {};

(function () {
    "use strict";

ns_editor.buildForm = function (dataId, data, schema, geometryType)
{                            
    var aForm = document.createElement("form");
    aForm.id = "__form__" + dataId;
    
    //WINDOW TITLE
    var aFieldset = document.createElement("fieldset");        
    var aLegend = document.createElement("legend");
    aLegend.innerHTML = xCore.globalobjects.activeAsset.name;

    //TOOLBAR
    var aToolbar = document.createElement("div");
    aToolbar.id = "editorToolbar";    
    var editBtn = document.createElement("a");
    editBtn.setAttribute("href","#");                
    var editIco = document.createElement("i");
    editIco.setAttribute("class","icon-pencil");
    editBtn.appendChild(editIco);    
    editBtn.onclick = function()
    {        
        ns_gmaps.overlays[geometryType][dataId].setDraggable(true);
        ns_gmaps.overlays[geometryType][dataId].setIcon(ns_gmaps.changePin("FFCC00"));
        ns_gmaps.overlays[geometryType][dataId].setAnimation(google.maps.Animation.BOUNCE);
        var inputFields = document.getElementsByName("inputFields");        
        for (var i = 0; i < inputFields.length; i++) {
            inputFields[i].removeAttribute("readonly");
        }
        document.getElementById("submitbtn").style.display = "visible";
    };     
    aToolbar.appendChild(editBtn);
        
    for (var i = 0; i < schema.columns.length; i++) 
    {
        var label = document.createElement("label");
        var inputField = document.createElement("input"); 
        
        if(schema.columns[i].name !== schema.primaryGeometry)
        {
            label.innerHTML = schema.columns[i].name;            
            inputField.setAttribute("name","inputFields");
            inputField.setAttribute("id", aForm.id + "__" + schema.columns[i].name);
            inputField.setAttribute("type","text");
            inputField.setAttribute("readonly","readonly");
            inputField.setAttribute("placeholder","an helpful hint ... ");                
            inputField.value = data.geojsonProperties[schema.columns[i].name];
        }
        
        aFieldset.appendChild(label);
        aFieldset.appendChild(inputField);   
    }
     
    
    var submitBtn = document.createElement("a");
    submitBtn.id = "submitbtn";
    submitBtn.setAttribute("href","#");        
    submitBtn.setAttribute("class","btn btn-primary");
    submitBtn.setAttribute("style","display:none");
    submitBtn.innerHTML = "Submit";
    submitBtn.onclick = function()
    {                     
        var tableId = dataId.split("__")[0];
        
        var requestBody;
        
        //Object geometry
        var newGeometry = {};            
        if(ns_gmaps.overlays[geometryType][dataId])
        {
            var newCoords;
            switch (geometryType) 
            {
                case "points":
                    newCoords = ns_gmaps.overlays[geometryType][dataId].getPosition(); 
                    newGeometry.coordinates = [newCoords.lng(),newCoords.lat()];
                    newGeometry.type = geometryType;  
                break;
                case "Polygon":
                    newGeometry.type = geometryType;                        
                    newCoords = ns_gmaps.overlays[geometryType][dataId].getPaths().getArray();
                    for (var i = 0; i < newCoords.length; i++) 
                    {
                        newGeometry.coordinates = [];
                        newGeometry.coordinates.push([]);
                        for (var j = 0; j < newCoords[i].getArray().length; j++) {
                                     newGeometry.coordinates[i].push([newCoords[i].getArray()[j].lng(),newCoords[i].getArray()[j].lat()]);                        
                        }
                    }
                break;
            }                                                            
        }                        

           
        //Object properties
        var newProperties = {};                     
        for (var i = 0; i < schema.columns.length; i++) 
        {                   
            var inputField = document.getElementById(aForm.id + "__" + schema[i].name);
            if (inputField && data.geojsonProperties[schema.columns[i].name] && (data.geojsonProperties[schema.columns[i].name] != inputField.value))     //Edited value                
            {
                newProperties[schema.columns[i].name]= inputField.value;
                //editedIndexer.push([dataId.split("__")[1],i,inputField.value]);                
            }
        }
        
        requestBody =
        {
            "features" : 
            [
                {
                    "geometry" : newGeometry , 
                    "id" : data.id, 
                    "properties" : newProperties, 
                    "type" :data.type
                }
            ]            
        };
        
        ns_gme.updateFeatures(tableId, requestBody);
    };
    
    aForm.appendChild(aLegend);
    aForm.appendChild(aToolbar);        
    aForm.appendChild(aFieldset);     
    aForm.appendChild(submitBtn);
     
    return aForm;
};

}());