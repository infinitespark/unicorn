// GE GeoSpatial Server (GSS) Integration via Native Virtual Server (resp. xml)
//"use strict";
xCore.globalobjects.gss = {};
xCore.globalobjects.gss.requests = {};
xCore.globalobjects.gss.schemas = {};

var ns_gss = {
  
    settings : xCore.modules.gss.settings,  

    send: function(url, callback, callbackParams)
    {                                
        //Register
        if(xCore.globalobjects && url && url != ""){
            xCore.globalobjects.gss.activeRequest = {};
            xCore.globalobjects.gss.activeRequest.success = false;
            xCore.globalobjects.gss.activeRequest.url = ns_gss.settings.gssBaseUrl + url;
            //SEND ... JQUERY AJAX short version
            //$.get(xCore.globalobjects.gss.activeRequest.url, function(response){
            $.get("test/description.xml", function(response){
                    callback(response , xCore.globalobjects.gss.activeRequest.id);
                }
                , 'xml');
        }                                                                 
    },
    native:
    {
        request : function(service, method, args, callback){
            ns_gss.native.service = service;
            ns_gss.native.method = method;
            ns_gss.native.args = args;
            
            ns_gss.native.url = "service=" + service + "&method=" + method;
            for (var key in args) {
                if (args.hasOwnProperty(key)) {
                    ns_gss.native.url += "&" + key + "=" + args[key];
                }
            }
            
            ns_gss.send(ns_gss.native.url, callback, null);
        }
    }, 
    editor:
    {
        compose: function(xmlResponse, id)
        {
            showLoader();
            var infowindow = xCore.globalobjects.overlays.infowindows.objs[xCore.globalobjects.overlays.infowindows.active];
            var somehtml = "<h1>No Object!</h1>";
            
            if(xmlResponse.getElementsByTagName("error").length > 0){
                var sText = (xCore.settings.application.browser.ie)? 
                            xmlResponse.getElementsByTagName("error")[0].getElementsByTagName("message")[0].text : 
                            xmlResponse.getElementsByTagName("error")[0].getElementsByTagName("message")[0].textContent;
                somehtml = "<h1>" + sText + "</h1>";
            } 
            else {
                var allelements = xmlResponse.getElementsByTagName('element');
                for (var i = 0; i < allelements.length; i++) {
                    if (allelements[i].getAttribute('key') === "description") {
                        infowindow.title = allelements[i].textContent;
                    }
                }
                
                var FeatureCollection = xmlResponse.getElementsByTagNameNS(ns_gss.settings.xmlnamespaces.gml,'FeatureCollection');
                
                for (var i = 0; i < FeatureCollection.length; i++) {
                    var aSchema = FeatureCollection[i].getAttributeNS(ns_gss.settings.xmlnamespaces.xsi,'schemaLocation').split(' ')[1];
                    var aTableName = aSchema.split('gis.')[1].split('.xsd')[0];
                    var featureMembers = xmlResponse.getElementsByTagNameNS(ns_gss.settings.xmlnamespaces.sw,'gis.' + aTableName)[0];
                    var assetId = featureMembers.getAttributeNS(ns_gss.settings.xmlnamespaces.gml,'id');
                    
                    infowindow.urn = assetId;
                    
                    //Record
                    var requests = xCore.globalobjects.gss.requests;
                        requests[assetId] = xCore.globalobjects.gss.activeRequest;
                        requests[assetId].collectionName = aTableName;
                        requests[assetId].boundingbox = xmlResponse.getElementsByTagNameNS(ns_gss.settings.xmlnamespaces.gml,'Envelope');
                        requests[assetId].featureMembers = featureMembers;
                        requests[assetId].success = true;
                    
                    xCore.globalobjects.gss.activeRecord = assetId;
                    
                    //Schema    
                    var schemas = xCore.globalobjects.gss.schemas;
                    if (schemas[requests[assetId].collectionName]) { //This schema already exists and it's parsed .. let's build the editor
                        ns_gss.editor.build(assetId);
                    }
                    else {
                        //$.get(aSchema, function(data){
                        $.get('test/schema.xsd', function(xsdResponse){
                            schemas[requests[assetId].collectionName] = xsdResponse;
                            
                            var currentSchema = schemas[requests[assetId].collectionName];
                            var fieldNodes= currentSchema.getElementsByTagName('sequence');
                            
                            currentSchema.hasJoins = false;
                            currentSchema.hasGeometries = false;
                            currentSchema.hasRichFiekds = false;
                            
                            for (var i = 0; i < fieldNodes.length; i++) {
                                var fieldArray = fieldNodes[i].getElementsByTagName('element');
                                currentSchema.internalNames = []; //All fields internal names
                                currentSchema.joinFields = []; //Join fields internal names
                                currentSchema.geoFields = []; //Geometry fields internal names
                                currentSchema.richFields = []; //Rich fields internal names (Special fields)
                                currentSchema.parsed = {}; //fully parsed json schema
                                currentSchema.physicalFields = []; //ALl non special fields
                                
                                var isSpecialField = false; //Is special (Joins, Geo or Rich) fields
                                
                                for (var j = 0; j < fieldArray.length; j++) {
                                    var fieldAttributes = {};
                                    var fieldInternalName = fieldArray[j].getAttribute('name');
                                    
                                    //All fields
                                    currentSchema.internalNames.push(fieldInternalName);
                                    
                                    //Joins
                                    if (fieldArray[j].hasChildNodes()) {
                                        currentSchema.joinFields.push(fieldInternalName);
                                        fieldAttributes.type = 'join'; //xlink:simpleLink?!?
                                        isSpecialField = true;
                                        currentSchema.hasJoins = true;
                                    }
                                    
                                    //Geometries
                                    if (fieldArray[j].getAttribute('type') && fieldArray[j].getAttribute('type') === "gml:GeometryPropertyType" ) {
                                        currentSchema.geoFields.push(fieldInternalName);
                                        isSpecialField = true;
                                        currentSchema.hasGeometries = true;
                                    }
                                    
                                    //Rich fields (see module settings)
                                    if (ns_gss.settings.richfields[fieldInternalName]) {
                                        currentSchema.richFields.push(fieldInternalName);
                                        isSpecialField = true;
                                        currentSchema.hasRichFiekds = true;
                                    }
                                    
                                    for (var k = 0; k < fieldArray[j].attributes.length; k++) {
                                        fieldAttributes[fieldArray[j].attributes[k].name] = fieldArray[j].attributes[k].value;
                                    }
                                    
                                    //Non Special Fields
                                    if(!isSpecialField){
                                        currentSchema.physicalFields.push(fieldInternalName);    
                                    }
                                    
                                    //Full Schema
                                    currentSchema.parsed[fieldInternalName] = fieldAttributes; 
                                }
                            }    
                            ns_gss.editor.build(assetId);   
                        }, "xml");
                    }
                }
            }
        },
        build: function(assetId){
            if (xCore.globalobjects.overlays.infowindows.active) {
                var iwid = xCore.globalobjects.overlays.infowindows.active;
                var aInfowindow = xCore.globalobjects.overlays.infowindows.objs[iwid];
                
                if(aInfowindow){
                    //Some DOM house cleaning
                    var infowindow = aInfowindow.content;
                    var infowindowtitle = document.getElementById(infowindow.id + '__title');
                        infowindowtitle.innerHTML = aInfowindow.title;
                    var infowindowurn = document.getElementById(infowindow.id + '__urn');
                        infowindowurn.innerHTML = aInfowindow.urn;
                    var infowindowbody = document.getElementById(infowindow.id + '__body');
                        infowindowbody.innerHTML = "";
                    var infowindowtoolbar = document.getElementById(infowindow.id + "__toolbar");
                        infowindowtoolbar.innerHTML = "";
                    
                    //Sorting out the object
                    var asset = xCore.globalobjects.gss.requests[assetId];
                    var schema = xCore.globalobjects.gss.schemas[asset.collectionName];
                    
                    var navtab = {
                        'index': '1',
                        'label':'Detalhes' , 
                        'classname':'active'
                    };
                        
                    
                    infowindowbody.appendChild(ns_gss.editor.createPage(assetId, infowindow.id + '__page__' + navtab.index, schema.internalNames, ""));
                    ns_gss.editor.createNavigation(infowindow, navtab, true);
                    // Little adjustment just to accomodate the navigation bar
                    infowindowbody.style.margin = "50px 0px 5px 5px";
                    
                    aInfowindow.close();
                    aInfowindow.open(ns_gmaps.map);
                    
                    hideLoader();
                } 
            }
        },
        createNavigation: function(infowindow , navtab, init){
            var aDiv = document.getElementById(infowindow.id + "__navigation");
            if(!aDiv){
                aDiv = document.createElement('div');  
                aDiv.id = infowindow.id + "__navigation";
                aDiv.setAttribute('class' , 'infowindownavigation');
                infowindow.appendChild(aDiv);
            } else if (init){
                aDiv.innerHTML = "";
            }
            
            var aUl = document.getElementById(infowindow.id + '__bar');
            if(!aUl){
                aUl = document.createElement('ul');
                aUl.className = "nav nav-pills";
                aUl.id = infowindow.id + '__bar';
            }
    
            var aLi = document.getElementById(infowindow.id + '__tab__' + navtab.index);
            var aA  = document.getElementById(infowindow.id + '__ico__' + navtab.index);
            
            if(!aLi){
                aLi = document.createElement('li');
                aLi.id = infowindow.id + '__tab' + '__' + navtab.index;
            }
            
            if(!aA){
                aA = document.createElement('a');
                aA.id = infowindow.id + '__ico' + '__' + navtab.index;
            }
            
            aA.innerHTML = navtab.label;
            aA.setAttribute("href", "#");
            aA.setAttribute("onclick", "ns_gss.editor.switchPage('" + navtab.index + "')");
            aLi.className = navtab.classname;
            
            aLi.appendChild(aA);   
            aUl.appendChild(aLi);
            aDiv.appendChild(aUl);
            
            
        },
        switchPage: function(index){
            var infowindow = xCore.globalobjects.overlays.infowindows.objs[xCore.globalobjects.overlays.infowindows.active];
            var infowindowbody = document.getElementById(infowindow.content.id + '__body');
            
            //switch tab
            var navbar = document.getElementById(infowindow.content.id + '__bar');
            if(navbar && navbar.children && navbar.children.length > 0){
                var navtabs = navbar.children;
                for (var i = 0; i < navtabs.length; i++) {
                    navtabs[i].removeAttribute('class');
                }
            }
            
            var activetab = document.getElementById(infowindow.content.id + '__tab' + '__' + index);
            if(activetab){
                activetab.className = 'active';
            }
            
            //switch page
            var allpages = infowindowbody.getElementsByTagName('table');
            for (var i = 0; i < allpages.length; i++) {
                allpages[i].style.display = 'none';
            }
            
            var activepage = document.getElementById(infowindow.content.id + '__page' + '__' + index);
            if(activepage){    
                activepage.removeAttribute('style');
            }
        },
        createPage: function(assetId, pageid, fieldArray, cssStyle){
            var asset = xCore.globalobjects.gss.requests[assetId];
            var schema = xCore.globalobjects.gss.schemas[asset.collectionName];      

            var aTable = document.createElement('table');
                aTable.className = "table table-striped";
                if(cssStyle != ""){
                    aTable.setAttribute('style' , cssStyle);
                }
                aTable.id = pageid;
            
            for (var i = 0 ; i < fieldArray.length ; i++) {
                var internalName = fieldArray[i];
                var externalname = schema.parsed[internalName]["sw:name"];
                var values = asset.featureMembers.getElementsByTagNameNS(ns_gss.settings.xmlnamespaces.sw, internalName);
                var netvalue = "";
                var externalvalue = '&nbsp;';
                
                if (values !== null && values !== "" && values.length > 0) {
                    for (var j = 0; j < values.length; j++) {
                        netvalue = externalvalue = values[j].textContent;
                        if ($.inArray(internalName, schema.joinFields) > -1) {
                            if (values[j].hasChildNodes() && values[j].getElementsByTagNameNS(ns_gss.settings.xmlnamespaces.sw, 'count')) {
                                var jointCount = values[j].getElementsByTagNameNS(ns_gss.settings.xmlnamespaces.sw, 'count')[0].textContent; 
                                var safeexternalname = externalname.replace(/\s/g, '&nbsp;');
                                externalname += " (" + jointCount + ")";
                                externalvalue = "<a href='#' onclick=ns_gss.editor.getJoinedObjects('" + assetId + "','" + internalName + "','" + safeexternalname + "')><i class='icon-share-alt'></i></a>"; 
                            }
                        }
                        else if($.inArray(internalName, schema.geoFields) > -1){
                            externalvalue = "<a href='#' onclick=ns_gss.editor.gotoGeometry('" + netvalue + "')><i class='icon-map-marker'></i></a>"; 
                        }
                        else if($.inArray(internalName, schema.richFields) > -1){
                            //externalvalue = "<a href='#' onclick=" + ns_gss.settings.richfields[internalName].handler + "('" + netvalue + "')>" + ns_gss.settings.richfields[internalName].html + "</a>"; 
                            externalvalue = eval(ns_gss.settings.richfields[internalName].handler + "('" + netvalue + "')");
                        }   
                        else {
                            externalvalue = values[j].textContent;
                        }
                    }
                }
                
                //Build table
                var aRow = document.createElement('tr');
                aRow.id = internalName + '__tr'; 
                aRow.setAttribute('netvalue' , netvalue);
                aRow.innerHTML = "<td id='label'>" + externalname + ": </td><td id='value'>" + externalvalue + "</td>";
                if(externalvalue === ""){//Empty rows don't go
                    aRow.setAttribute('style','display:none');
                }
                aTable.appendChild(aRow);
            }
            
            return aTable;
        },
        createList : function(id, joins, index){
            var aTable = document.getElementById(id + "__page__" + index);
            if(!aTable){
                aTable = document.createElement("table");
                aTable.setAttribute('class', 'table table-striped');
                aTable.id = id + "__page__" + index;
                document.getElementById(id + "__body").appendChild(aTable);
            }
            
            aTable.innerHTML = "";
            for (var i = 0; i < joins.length; i++) {
                var aRow = document.createElement('tr');
                    aRow.id = joins[i].urn + '__tr';
                var fColumn = document.createElement('td');
                    fColumn.id = 'label';
                    fColumn.innerHTML = joins[i].label;
                var sColumn = document.createElement('td');
                    sColumn.id = 'value';
                var aA = document.createElement('a');
                    aA.setAttribute('href','#');
                    aA.setAttribute('onclick',"ns_gss.native.request('object_info', 'info', { 'objects': '" + joins[i].urn + "' , 'return_info' : 'description' }, ns_gss.editor.compose);");
                var aI = document.createElement('i');
                    aI.setAttribute('class','icon-share-alt');
                    //aRow.innerHTML = "<td id='label'>" + joins[i].label + ": </td><td id='value'><a href='#' onclick=ns_gss.native.request('object_info', 'info', { 'objects': '" + joins[i].urn + "' , 'return_info' : 'description' }, ns_gss.editor.compose)'><i class='icon-share-alt'></i></a></td>";
                aA.appendChild(aI);
                sColumn.appendChild(aA);
                aRow.appendChild(fColumn);
                aRow.appendChild(sColumn);
                aTable.appendChild(aRow);    
            }
        },
        gotoLink : function(url){
            //window.open(url);
            var html = "<a href='" + url + "' target='_blank'><i class='icon-share-alt'></i></a>";
            return html;
        },
        parseDate: function(dateStr){
            var dateTime = dateStr.split('T');
            var externalDate = dateTime[0] + ' ' +  dateTime[1].split('.')[0];
            return externalDate;
        },
        gotoGeometry : function(geometryUrn){
            console.log('Going to geometry!!: ' + geometryUrn);   
        },
        getJoinedObjects : function(urn, relationshipProperty, label){
            var infowindow = xCore.globalobjects.overlays.infowindows.objs[xCore.globalobjects.overlays.infowindows.active];
            var navtab = {'index': '2','label':label , 'classname':''};
            if (xCore.globalobjects.gss.requests[urn] &&
                xCore.globalobjects.gss.requests[urn].joinedObjects &&
                xCore.globalobjects.gss.requests[urn].joinedObjects[relationshipProperty] && 
                xCore.globalobjects.gss.requests[urn].joinedObjects[relationshipProperty].fullObject && 
                xCore.globalobjects.gss.requests[urn].joinedObjects[relationshipProperty].parsed) {
                    var parsedJoins = xCore.globalobjects.gss.requests[urn].joinedObjects[relationshipProperty].parsed.array; 
                    ns_gss.editor.createNavigation(infowindow.content, navtab, false); //Changes Navigation bar
                    ns_gss.editor.createList(infowindow.content.id, parsedJoins, navtab.index); //Creates join list page
                    ns_gss.editor.switchPage(navtab.index); //Switches page
            }
            else {
            
                 //ns_gss.native.request('object_info', 'joined_objects', {'objects': urn , 'relationship_property' : relationshipProperty , 'return_info' : 'features' }, ns_gss.editor.compose);
                 $.get('test/joined_objects.xml', function(response){
                    var elements = response.getElementsByTagName('element');
                    var joinObjectsNode, joinElements;
                    for (var i = 0; i < elements.length; i++) {
                        if (elements[i].getAttribute('key') === "joined_objects") {
                            joinObjectsNode = elements[i];
                            //Register
                            xCore.globalobjects.gss.requests[urn].joinedObjects = {};
                            xCore.globalobjects.gss.requests[urn].joinedObjects[relationshipProperty] = {};
                            xCore.globalobjects.gss.requests[urn].joinedObjects[relationshipProperty].fullObject  = joinObjectsNode;
                            joinElements = joinObjectsNode.getElementsByTagNameNS(ns_gss.settings.xmlnamespaces.gml, 'featureMembers');
                        }  
                    }
                                    
                    //Add tab to navigation bar
                    ns_gss.editor.createNavigation(infowindow.content, navtab);
                    
                    
                    //Create Join Page
                    joinObjectsNode.parsed = {};
                    joinObjectsNode.parsed.array = [];
                    for (var i = 0; i < joinElements.length; i++) {
                        if(joinElements[i].firstElementChild){
                           joinObjectsNode.parsed.array.push({
                               'urn'    : joinElements[i].firstElementChild.getAttributeNS(ns_gss.settings.xmlnamespaces.gml, 'id'),
                               'label'  : joinElements[i].firstElementChild.firstElementChild.textContent   
                            });
                        }
                    }
                    joinObjectsNode.parsed.success = true;
                    ns_gss.editor.createList(infowindow.content.id, joinObjectsNode.parsed.array, navtab.index);
                    ns_gss.editor.switchPage(navtab.index);
                 });
            }
        }
    }
};