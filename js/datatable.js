var ns_datatable = {};

(function () {
    "use strict";
    
    google.load('visualization', '1', {packages:['table']});
    google.setOnLoadCallback(ns_datatable.buildDataTable);
      
    ns_datatable.settings = xCore.modules.datatable.settings;
            
    ns_datatable.data = null;
    ns_datatable.schema = null;
    ns_datatable.datatable = {}; //Table complete Object    
    ns_datatable.table = {}; //Table complete Object
    ns_datatable.table.htmlContainer = null;  //Html div id where the table was placed
    ns_datatable.table.selectedRows = []; //Array of selected row indexes
        
    
    ns_datatable.buildDataTable = function (objectID, containerId, schema, data)
    {                            
        ns_datatable.data = data;
        ns_datatable.schema = schema;  
        
        var container = document.getElementById(containerId);
                
        if(container)
        {
            container.innerHTML = "";
            ns_datatable.datatable = new google.visualization.DataTable();
            var dataColumns = [];
            
            //Build datatable model from schema.            
            for (var i = 0; i < schema.columns.length; i++)             
            {
                var columnDataHandler = ns_datatable.settings.datahandler[schema.columns[i].type];                
                ns_datatable.datatable.addColumn(columnDataHandler.datatype, schema.columns[i].name); 
                ns_datatable.datatable.setColumnProperty(i,"columnname", schema.columns[i].name );
                ns_datatable.datatable.setColumnProperty(i,"originaltype", schema.columns[i].type );
                ns_datatable.datatable.setColumnProperty(i,"functionhandler", columnDataHandler.functionHandler);                
                ns_datatable.datatable.setColumnProperty(i,"maxlength", columnDataHandler.maxlength);  
                ns_datatable.datatable.setColumnProperty(i,"decimalplaces", columnDataHandler.decimalplaces);                                         
                dataColumns.push(schema.columns[i].name);
            }
            
            //Get data into datatable structure. Check datatypes and shape data.
            //for (i = 0; i < data.length; i++) 
            for(var i in data)
            {
                /*
                var recordProperties = data[i].geojsonProperties;
                var position = data[i].position;
                */
                var recordProperties = data[i].properties;
                var position = recordProperties.gx_id;
                var dataRow = [];
                for (var k = 0; k < dataColumns.length; k++) 
                {                
                    var columnProperties = ns_datatable.datatable.getColumnProperties(k);                    
                    var record; 
                                        
                    if(columnProperties.columnname && columnProperties.columnname === schema.primaryGeometry)
                        record = position;
                    else
                        record = recordProperties[dataColumns[k]];
                        
                    if(columnProperties.functionhandler && columnProperties.functionhandler.length > 0) 
                        record = eval(columnProperties.functionhandler)(record, columnProperties);
                    
                    dataRow.push(record);                                                            
                }   
                
                ns_datatable.datatable.addRow(dataRow);
            }
            
            ns_datatable.table = new google.visualization.Table(document.getElementById(containerId));
            
            google.visualization.events.addListener(ns_datatable.table, 'select', ns_datatable.tableSelect);
            
            /*
            var formatter = new google.visualization.BarFormat({width: 10});
            formatter.format(datatable, 0); // Apply formatter to second column
            */
            var tableOptions = ns_datatable.settings.tableOptions;
   
            ns_datatable.table.htmlContainer = containerId; //Ref
            ns_datatable.datatable.id = objectID;
            ns_datatable.table.draw(ns_datatable.datatable, tableOptions);
            
            //ns_gmaps.();
        }        
    };
    
    ns_datatable.tableSelect = function()
    {
        var tableSelection = ns_datatable.table.getSelection();        
        ns_datatable.table.selectedRows= [];
        
        if(tableSelection && tableSelection.length > 0)
        {        
            for (var i = 0; i < tableSelection.length; i++) 
            {
                var selectedItem = tableSelection[i];                  
                ns_datatable.table.selectedRows.push(selectedItem.row); //Ref                
            }   
        }        
    };
    
    ns_datatable.clearResults = function()
    {
        var htmlContainer =  document.getElementById(ns_datatable.table.htmlContainer);
        htmlContainer.innerHTML = "";
        
        ns_datatable.table.htmlContainer = null;
        ns_datatable.table.selectedRow = [];
       
        //ns_gmaps.();
    };
    
    ns_datatable.ShowRowInMap = function(someRows)
    {
        var selectedRows;
        var featuresKeys = Object.keys(ns_datatable.data);
        
        if(someRows){
            selectedRows = someRows;
        }
        else if (ns_datatable.table.selectedRows && ns_datatable.table.selectedRows.length > 0){
            selectedRows = ns_datatable.table.selectedRows;
        }
        
        if(selectedRows && selectedRows.length > 0)
        {
            for (var i = 0; i < selectedRows.length; i++) {
                //ns_gmaps.rowToMap(ns_datatable.datatable.id,ns_datatable.data[featuresKeys[i]], ns_datatable.schema, selectedRows[i]);                            
                ns_gmaps.drawGeoJSON(ns_datatable.data[featuresKeys[i]]);
            }            
        }
    };
    
    ns_datatable.editRow = function(aRow)
    {
        var selectedRow;
        
        if(aRow){
            selectedRow = aRow;
        }
        else if (ns_datatable.table.selectedRows && ns_datatable.table.selectedRows.length > 0){
            selectedRow = ns_datatable.table.selectedRows[0];
        } 
        
        if(selectedRow)
        {            
            ns_ui.buildEditForm(ns_datatable.data[ns_datatable.selectedRow]);
        }
    };
    
    
    function stringHandler(str, properties)
    {
        var cellValue = "";
        if(str && str !== "")
        {
            if(str.indexOf("http://") > -1 ) //External Docs
            {
                cellValue = "<a href='" + str + "' target='_blank'><i class='icon-file'></i></a>";
            }
            else
            {
                cellValue = (str.length > properties.maxlength)? "<span title='" + str + "'>" + str.substring(0 , properties.maxlength - 3) + "...</span>" : str;                        
            }
        }
        
        return cellValue;
    }
    
    function geometryHandler(geometryObject, properties)
    {
       var cellValue = ""; 
       
       if(geometryObject && properties)
        {            
            if(ns_gmaps.settings.overlayObjects[properties.originaltype] && ns_gmaps.settings.overlayObjects[properties.originaltype].icon)
                cellValue ="<i class='" + ns_gmaps.settings.overlayObjects[properties.originaltype].icon + "' title='" + geometryObject.type  + "'></i>";

        }
        
        return cellValue;        
    }
        
}());