//URLS
var SERVER_PREFIX = NSGlobal.CONST____Servidor + NSGlobal.CONST____ServidorCaminhoNative + "?"; //"http://lusiglobpt.services.logica.com/gss/native?";

//HTML Construct
var bodyDiv;
var mainDiv;
var banner;
var navigation;
var content;
var aside;
var footer;
var toolbar;

// DATA Elements------------------------------------------------------------------------
var MAIN_OBJECT_URN;
var DATASET;
var COLLECTION;
var COLLECTION_EXTERNAL_NAME;

var formatedObject;
var formatedJoinObjects;
var urn;
  
var objectSchema;
var fullObject;
var objectData;
var joinObjects;
var errorMessage;
var criarInfoHtml;
var activeWindows = new Array();
var infoWindowsGUID;
var bodyHeight;

var feature_start = 1;
var feature_count = 150;

var hasEmptyRows = false;

//Collection tabs pagination
var ipageSize_collectionTabs = 3;
var iCurrentPage_collectionTabs;
var iTotalPages_collectionTabs;

getInfoHtml = function (xmlResponse, oInfoWindow)
{	
  infoWindowsGUID = guidGenerator();
  oInfoWindow.set('id',infoWindowsGUID);
  activeWindows.push(oInfoWindow);
  
  var infoWindowHTML = "<h1>No Object!</h1>";
  if(xmlResponse.getElementsByTagName("error").length > 0)
  {
	  var sText = (NSGlobal.bIE)? xmlResponse.getElementsByTagName("error")[0].getElementsByTagName("message")[0].text 
			  : xmlResponse.getElementsByTagName("error")[0].getElementsByTagName("message")[0].textContent;
    infoWindowHTML = "<h1>" + sText + "</h1>";
  }
  else
  {
    composeObject(xmlResponse);    
    infoWindowHTML = buildHTML(infoWindowsGUID);   
  } 
    
  return infoWindowHTML;
}

function validateXmlResponse(aRequest)
{   
  var xmlResponse = xmlRequest(aRequest); 
    
  if(xmlResponse.getElementsByTagName("error").length > 0)
  {
    errorMessage = (NSGlobal.bIE)? xmlResponse.getElementsByTagName("error")[0].getElementsByTagName("message")[0].text
    		: xmlResponse.getElementsByTagName("error")[0].getElementsByTagName("message")[0].textContent;
    xmlResponse = null;
    
  }          
  return xmlResponse;
}


function xmlRequest(dname)
{
  if (window.XMLHttpRequest)
    var xhttp=new XMLHttpRequest();
  else
    var xhttp=new ActiveXObject("Microsoft.XMLHTTP");
  
  xhttp.open("GET",dname,false);
  xhttp.send("");
  return xhttp.responseXML;
}

function gotoObject(guidUrn)
{
  var urn = guidUrn.split(".")[1];
  var windowGUID = guidUrn.split(".")[0];
  
  var aRequest = SERVER_PREFIX + "service=object_info&return_info=description&objects=" + urn;  
  var xmlResponse = validateXmlResponse(aRequest);  
  
  if(xmlResponse != null)
  {
    composeObject(xmlResponse);
    infoWindowHTML = buildHTML(windowGUID);
  }
  
  for(var i  = 0 ; i < activeWindows.length ; i++)
  { 
    if(activeWindows[i].get('id') == windowGUID)
    {
    	activeWindows[i].set('bAdjustContent',true);
    	activeWindows[i].setContent(infoWindowHTML);
    }
  }
}


//Gets both object schema and data
function composeObject(xmlResponse, oInfoWindow)
{  

	fullObject = getObjectInfo(xmlResponse, "return/service_response/object_info");
	urn = fullObject[0];
	COLLECTION_EXTERNAL_NAME = fullObject[1];
	objectData = fullObject[4];
	objectSchema = getSchema(DATASET, COLLECTION);
	formatedObject = mergeData2Schema(objectData,objectSchema);
	
	joinObjects = new Array();

	/*Global Vars
    ipageSize_collectionTabs;
    iTotalPages_collectionTabs;
    iTotalPages_collectionTabs
	 */
	iCurrentPage_collectionTabs = 0;
	
	composeObject_forCollectionTabsPage(iCurrentPage_collectionTabs);

}
function showNextTabs(s_windowGUID)
{
	/*Global Vars:
	ipageSize_collectionTabs
	iCurrentPage_collectionTabs
	iTotalPages_collectionTabs
	*/

	if(iCurrentPage_collectionTabs+1<iTotalPages_collectionTabs)
	{
		var iPageNumber = iCurrentPage_collectionTabs+1;  
		composeObject_forCollectionTabsPage(iPageNumber)
		iCurrentPage_collectionTabs = iPageNumber;
		infoWindowHTML = buildHTML(s_windowGUID);
		for(var i  = 0 ; i < activeWindows.length ; i++)
		{ 
			if(activeWindows[i].get('id') == s_windowGUID)
			{
				activeWindows[i].set('bAdjustContent',true);
				activeWindows[i].setContent(infoWindowHTML);
			}
		}
	}
	
}
function showPreviousTabs(s_windowGUID)
{
	/*Global Vars:
	ipageSize_collectionTabs
	iCurrentPage_collectionTabs
	iTotalPages_collectionTabs
	*/

	if(iCurrentPage_collectionTabs-1 >=0 )
	{
		var iPageNumber = iCurrentPage_collectionTabs-1;
		//redundant
		//composeObject_forCollectionTabsPage(iPageNumber)
		iCurrentPage_collectionTabs = iPageNumber;
		infoWindowHTML = buildHTML(s_windowGUID);
		for(var i  = 0 ; i < activeWindows.length ; i++)
		{ 
			if(activeWindows[i].get('id') == s_windowGUID)
			{
				activeWindows[i].set('bAdjustContent',true);
				activeWindows[i].setContent(infoWindowHTML);
			}
		}
	}	
	
}
//Gets both object schema and data
function composeObject_forCollectionTabsPage(iPageNumber)
{ 
  /*
  The following objectes were already created and initialized on the first call
  fullObject = getObjectInfo(xmlResponse, "return/service_response/object_info");
  urn = fullObject[0];
  COLLECTION_EXTERNAL_NAME = fullObject[1];
  objectData = fullObject[4];
  objectSchema = getSchema(DATASET, COLLECTION);
  formatedObject = mergeData2Schema(objectData,objectSchema);
  
  joinObjects = new Array();
  */

  var joinFieldsCount
  
  if(NSGlobal.bIE)
  {
   joinFieldsCount = objectData.selectNodes("//sw:count");
  }
  else
  {
    joinFieldsCount = objectData.getElementsByTagName(NSGlobal.ajustarPrefNS("sw:count"));
  }
  
  iTotalPages_collectionTabs = Math.ceil(joinFieldsCount.length / ipageSize_collectionTabs);
  iTotalPages_collectionTabs = ( iTotalPages_collectionTabs==0 )? 1 : iTotalPages_collectionTabs;
   
  /*Global Vars
  ipageSize_collectionTabs;
  iCurrentPage_collectionTabs;
  iTotalPages_collectionTabs
   */
  var iFirst = ipageSize_collectionTabs * iPageNumber;
  var iLast = (iFirst + ipageSize_collectionTabs < joinFieldsCount.length)? iFirst + ipageSize_collectionTabs : joinFieldsCount.length;
  if(joinObjects.length < iLast) // checking if information wasn't previously loaded
  {
	  if(joinFieldsCount.length > 0)
	  {    
		  //iteration through joinFieldsCount
	      for (var i = iFirst ; i < iLast ; i++)
	      {
	          var joinFieldInternalName = joinFieldsCount[i].parentNode.tagName.split(":")[1];
	          var joinCollection = joinFieldInternalName;
	          var joinFieldElements =joinFieldsCount[i].childNodes[0].nodeValue;
	          var joinFieldExternalName;
	          
	          var schemaIterator;
	          if(NSGlobal.bIE){schemaIterator = objectSchema;}else{schemaIterator = objectSchema[0].childNodes;}
	                    
	          for (var j = 0 ; j < schemaIterator.length ; j++) 
	          {                
	            if(schemaIterator[j].nodeType == 1 && schemaIterator[j].getAttribute("name") == joinFieldInternalName)
	              joinFieldExternalName = schemaIterator[j].getAttribute("sw:name");
	          }
	                                       
	          var childSchema = getSchema(DATASET, joinCollection);
	          if(childSchema == null)
	            childSchema = getSchema(DATASET, joinCollection.substring(0,joinCollection.length - 1));   //MAJOR PROBLEM
	          
	          var joinData = getJoinData(joinFieldInternalName, joinFieldExternalName,joinCollection, childSchema); 
	          joinObjects.push(new Array(joinFieldInternalName, joinFieldExternalName,joinFieldElements,childSchema, joinData));           
	      }
	  }  	  
  }
  
  
}

function mergeData2Schema(data, schema)
{
  var formatedObject = new Array();  
  var formatedData = new Array();
  var tableSchema;
  
  if(NSGlobal.bIE){tableSchema = schema}else{tableSchema = schema[0].childNodes;} 
  
  for (var i = 0 ; i < data.childNodes.length ; i++)
  {
    if(data.childNodes[i].nodeType == "1")
    {                 
      for (var j = 0 ; j < tableSchema.length ; j++)
      {         
        if(tableSchema[j].nodeType == "1" && tableSchema[j].getAttribute("name") == data.childNodes[i].tagName.split(':')[1])
        {        
          var nodeValue;
          if(NSGlobal.bIE){nodeValue = data.childNodes[i].text;}else{nodeValue = data.childNodes[i].textContent;}
          formatedData.push(new Array(tableSchema[j].getAttribute("name"),tableSchema[j].getAttribute("sw:name"),tableSchema[j].getAttribute("type"),nodeValue));                    
        }
      }
    }
  }
  
  formatedObject.push(data.tagName, data.getAttribute("gml:id"), formatedData);    
  return formatedObject;                     
}


//Get object info
function getObjectInfo(xmlResponse, xPath)
{
  var responseArray = new Array(); 
  var xPathNode;  
  var objectURN;
  var objectDescription;
  var objectCollection;
  var schemaLocation;
  var objectBoundingBox;
  var featureMembers; 

  xPathNode = NSFunctions.fGetElementsByTagName(xmlResponse, xPath);
  var iPosFirstRelevantChild = (NSGlobal.bIE)? 0 : 1;
  for (var i = 0; i < xPathNode.length; i++)
  {
       var hashNode0 = NSFunctions.fGetElementsByTagName(xPathNode[i], "hash")[0];
       var hashNode1 = NSFunctions.fGetElementsByTagName(xPathNode[i], "hash/element/hash")[0];
       objectURN = NSFunctions.fGetElementsByTagName(hashNode0, "element")[0].getAttribute("key");
       objectDescription = NSFunctions.fGetElementsByTagName(hashNode1, "element")[0].firstChild.nodeValue;
       objectCollection =  NSFunctions.fGetElementsByTagName(hashNode1, "element/gml:FeatureCollection")[0];
       schemaLocation = objectCollection.getAttribute("xsi:schemaLocation");  
       objectBoundingBox = NSFunctions.fGetElementsByTagName(objectCollection, "gml:boundedBy/gml:Envelope")[0]; // prepare for goto!!
       featureMembers = NSFunctions.fGetElementsByTagName(objectCollection, "gml:featureMembers")[0].childNodes[iPosFirstRelevantChild];  
       if(featureMembers != null && featureMembers.tagName != null)
       {
          MAIN_OBJECT_URN = objectURN;
          DATASET = featureMembers.tagName.split('.')[0].split(":")[1];
          COLLECTION = featureMembers.tagName.split('.')[1];
       }       
  }
    
  responseArray = new Array(objectURN, objectDescription, objectCollection, schemaLocation, featureMembers);
      
  return responseArray;
}

function getSchema(aDataset, aCollection)
{
  var aRequest = SERVER_PREFIX + "service=application_schema&dataset_names=" + aDataset + "&collection_names=" + aCollection;  
  var xmlResponse = validateXmlResponse(aRequest);
  var parsedSchema = null
  var fullSchema = null;
  
  if(xmlResponse != null)
  {     
    if(NSGlobal.bIE)
    {
      if(xmlResponse.selectNodes("/return/service_response/schema/database/dataset")[0].childNodes.length > 0)      
        fullSchema = xmlResponse.selectNodes("//schema")[0].childNodes[0].childNodes[0].childNodes[0].childNodes[2].childNodes[0].childNodes[0].childNodes[0].childNodes;
    }       
    else
    {
      fullSchema = xmlResponse.documentElement.getElementsByTagName(NSGlobal.ajustarPrefNS("xsd:sequence"));
    }
    
    if(fullSchema != null && fullSchema.length > 0)
    {
      parsedSchema = new Array();      
      for (var i = 0; i < fullSchema.length; i++)
      {
        if(fullSchema[i].nodeType == "1")
          parsedSchema.push(fullSchema[i]);
      }         
    }    
  }   
  return parsedSchema;  
}

//Get joins data
function getJoinData(joinFieldInternalName,joinFieldExternalName, joinCollection, schema)
{
  var aRequest = SERVER_PREFIX + "service=object_info&method=info&return_info=joined_objects&objects=" + MAIN_OBJECT_URN + "&relationship_property=" + joinFieldInternalName + "&feature_start=" + feature_start + "&feature_count=" + feature_count;  
  var elementsArray = new Array();
  var joinObjectsNode;  
  var xmlResponse = validateXmlResponse(aRequest);
  var i = 0;
  var j = 0;
  
  if(xmlResponse != null)
  {
    if(NSGlobal.bIE)
    {
      var auxJoinCollection = joinCollection;
      joinObjectsNode = xmlResponse.selectNodes("/return/service_response/object_info/hash/element/hash/element[1]/hash/element/gml:FeatureCollection/gml:featureMembers/sw:" + DATASET + "." + auxJoinCollection)
      
      if(joinObjectsNode.length == 0)
      {
        auxJoinCollection = joinCollection.substring(0,joinCollection.length - 1);
        joinObjectsNode = xmlResponse.selectNodes("/return/service_response/object_info/hash/element/hash/element[1]/hash/element/gml:FeatureCollection/gml:featureMembers/sw:" + DATASET + "." + auxJoinCollection)
      }
    }
    else
    {
      var auxJoinCollection = joinCollection;
      joinObjectsNode = NSFunctions.fGetElementsByTagNameNS(xmlResponse, DATASET + "." + auxJoinCollection, "sw", "http://gesmallworld.com/sw");;
      
      if(joinObjectsNode == null || joinObjectsNode.length == 0)
      {
        auxJoinCollection = joinCollection.substring(0,joinCollection.length - 1);
        joinObjectsNode  = NSFunctions.fGetElementsByTagNameNS(xmlResponse, DATASET + "." + auxJoinCollection, "sw", "http://gesmallworld.com/sw");
      }        
    }
            
    if (joinObjectsNode != null && joinObjectsNode.length != 0)
    {
         for (var i = 0; i < joinObjectsNode.length; i++)
          elementsArray.push(mergeData2Schema(joinObjectsNode[i], schema));
    }      
  }
  return elementsArray;
}

function buildHTML(windowGUID)
{
//Main Elements

//Infowindow content div dimensions
var infowindow_content_height = 300;
var infowindow_content_width = 300;
var infowindow_content_width_factor = 0;
  
  //Fake body .. just to aggregate
  bodyDiv = document.createElement('div');
  bodyDiv.setAttribute('id', 'editorBody');
  bodyDiv.setAttribute('guid', windowGUID);
  bodyDiv.setAttribute('name', 'editorBody_windowGUID_' + windowGUID);
  
  //Header banner
  banner = document.createElement('div');
  banner.setAttribute('id', 'editorBanner');
  banner.setAttribute('class' , 'body');
  
  //Toolbar
  toolbar = document.createElement('div');
  toolbar.setAttribute('id', 'editorToolbar');
  toolbar.setAttribute('class', 'editorToolbar');
  
  //Navigation bar
  navigation = document.createElement('div');
  navigation.setAttribute('id', 'editorNavigation');
  navigation.setAttribute('class', 'tabs');
  
  //Fetured block
  aside = document.createElement('div');
  aside.setAttribute('id', 'editorFeatured');
  aside.setAttribute('class', 'body');
  
  //Pages
  content = document.createElement('div');
  content.setAttribute('id', 'editorContent');
  content.setAttribute('name', 'editorContent_windowGUID_' + windowGUID);
  content.setAttribute('class', 'body');  
  content.setAttribute('style' , "height:" + infowindow_content_height + "px;width:" + infowindow_content_width + "px;");
  
  
  
  footer = document.createElement('div');
  footer.setAttribute('id', 'editorContentinfo');
  footer.setAttribute('class', 'body');


  var bannerHTML = "";
  var toolbarHTML = "";
  var navigationHTML = "";
  var pagesHTML = "";
  var footerElements = new Array();
  var asideElements = new Array();
  
  /*Global Vars
  ipageSize_collectionTabs;
  iCurrentPage_collectionTabs;
  iTotalPages_collectionTabs
   */
  var iFirst_joinObj = ipageSize_collectionTabs * iCurrentPage_collectionTabs;
  var iLast_joinObj = (iFirst_joinObj + ipageSize_collectionTabs < joinObjects.length)? iFirst_joinObj + ipageSize_collectionTabs -1: joinObjects.length -1;
  
  bannerHTML += '<h1 id="title">' + COLLECTION_EXTERNAL_NAME + '</h1>';  
  navigationHTML = '<ul id="tabs" name="'+ 'tabs_ul_windowGUID_' + windowGUID + '">'; //Navigation------------------------------------------------------------------  
  navigationHTML += '<li id="_tab:' + MAIN_OBJECT_URN + '"" class="active" onclick="selectTab(this.id);"><a href="#">Detalhes</a></li>';
  navigationHTML +='<li><div class="editorNavigationButton" guid="'+windowGUID+'"; onclick="showPreviousTabs(this.getAttribute(\'guid\'));"><img src="Imagens/left_lightyellowonblack.png" alt="Hide/Show" width="20" height="20"></div></li>';
  navigationHTML += '<li><div id="editorCurrentTab"><span>'+(iCurrentPage_collectionTabs+1)+'/'+iTotalPages_collectionTabs+'</span></div></li>';
  pagesHTML = '<div id="_page:' + MAIN_OBJECT_URN + '" class="on"></div>';//Section Main ------------------------------------------------------------------
    
  infowindow_content_width_factor = 172;//details + left arrow + page number + right arrow  
  if(joinObjects.length > 0) //It has join fields 
  {
	 //joinObjects iterarion
     for(var i = iFirst_joinObj ; i <= iLast_joinObj ; i++)  
     {
    	 
	  var sElementText = '(' + joinObjects[i][2] +')' + joinObjects[i][1];
	  
	  iElementTextMaxLength = 17;
	  if(sElementText.length > iElementTextMaxLength)
	  {
		  sElementText = sElementText.substr(0,iElementTextMaxLength-2) + "..."; // -2 because ellipsis need less than space chars 
	  }
	  
      navigationHTML += '<li id="_tab:' + MAIN_OBJECT_URN + '.' +  joinObjects[i][0] + '" class="editorNavigationTab" onclick="selectTab(this.id);"><a href="#" title="' + joinObjects[i][1] + '">' + sElementText +'</a></li>';
      pagesHTML += '<div id="_page:' + MAIN_OBJECT_URN + '.' +  joinObjects[i][0] + '" class="off"></div>';
      infowindow_content_width_factor  += 140;
     }    
  }
  
  navigationHTML +='<li><div class="editorNavigationButton" guid="'+windowGUID+'"; onclick="showNextTabs(this.getAttribute(\'guid\'));"><img src="Imagens/right_lightyellowonblack.png" alt="Hide/Show" width="20" height="20"></div></li>';
  navigationHTML += '</ul>';  
  
    //Prepare the html content
  banner.innerHTML = bannerHTML;
  navigation.innerHTML = navigationHTML;
  content.innerHTML = pagesHTML;  
  
  //Forms content per DIV
  var contentHtml = "<div><table class='detailPage'>";
  var footerHtml = "<table class='footerPage'><tr>";
  var asideHtml;    
  
  var objectDatasetCollection =  formatedObject[0];
  var objectURN =  formatedObject[1];
  var formatedData =  formatedObject[2];
  
  //Adjusting infowindow content div dimensions
  var newHeight = formatedData.length * 25;
  var newWidth = infowindow_content_width;
  if(infowindow_content_width_factor > newWidth)
    newWidth = infowindow_content_width_factor;
        
  content.setAttribute('style' , "height:" + newHeight + "px;width:" + newWidth + "px;");
  
  hasEmptyRows = false;
    
  for (var i = 0 ; i < formatedData.length; i++)
  {
    var internalName = formatedData[i][0];
    var externalName = formatedData[i][1];
    var dataType = formatedData[i][2];
    if(dataType != null && dataType.indexOf(":",0)!= -1){dataType = dataType.split(":")[1]};    
    var value = formatedData[i][3];
    if(dataType != null && dataType != "GeometryPropertyType" && internalName != "data_actualizacao" && internalName != "actualizado_por" ) //Removes geometries and joins
    { 
          if(value == "")
          {
            contentHtml += "<tr id='empty' style='display:none;'>";
            hasEmptyRows = true; //indicates if button to show empty fields should be visible
          }
          else
          {
            contentHtml += "<tr id='nonEmpty' style='display:block;'>";
          } 
          contentHtml += "<td id='label'>";
          contentHtml += "<label id=" + internalName + ">"  + externalName + "</label>"; 
          contentHtml += "</td><td id='value'>";
          contentHtml += "<span id=" + internalName + "><span id=" + dataType + ">";           
          contentHtml += htmlExceptions(internalName, value);          
          contentHtml += "</span></span>";
          contentHtml += "</td></tr>";
    }
    else if(internalName == "data_actualizacao" || internalName == "actualizado_por")
    {
      footerElements.push(formatedData[i]);
      footerHtml += "<td id='footerValue'>";
      footerHtml += "<span id=" + internalName + ">";      
      if(internalName == "data_actualizacao"){footerHtml += value.split('T')[0] + " ( " +  value.split('T')[1].split('+')[0].split('.')[0] + " )";}
      if(internalName == "actualizado_por"){footerHtml += value + " | ";}
      footerHtml += "</span>";
      footerHtml += "</td>";
    }          
  }
  
  contentHtml += "</table></div>";
  content.childNodes[0].innerHTML = contentHtml;
   
  footerHtml += "</tr></table>";
  footer.innerHTML = footerHtml;
  
  
   //JOIN FORMS
  var columnNumber = 3;
  var columnArray;

 if(joinObjects.length > 0) //It has join fields 
  { 
    //joinObjects iterarion
    for(var i = iFirst_joinObj ; i <= iLast_joinObj ; i++)  
    { 
        var joinHtml = "";  
	var joinGroup = joinObjects[i][4];
        for(var j = 0 ; j < joinGroup.length ; j++)
        {
          var joinElement = joinGroup[j];
	  var urn = joinElement[1];
          var formatedJoinElements = joinElement[2];
          var linkDescriptor = joinElement[2][0][3];            
            joinHtml += "<div id='" + windowGUID + "." + urn + "' onclick='gotoObject(this.id);'>";
            joinHtml += "<table class='detailPage'>";          
            joinHtml += "<tr><td><a href='#'>";   
            joinHtml += linkDescriptor; //index 1 in the array because the childNodes access mode always return a text bit in the index 0
            joinHtml += "</a></td></tr>";    
            joinHtml += "</table>";           
            joinHtml += "</div>";                 
        }
        
        for(var k = 0 ; k < content.childNodes.length ; k++)
        {
          if(content.childNodes[k].getAttribute('id') == "_page:" + MAIN_OBJECT_URN + '.' +  joinObjects[i][0])
          {
            content.childNodes[k].innerHTML = joinHtml; 
          }                
        }
              
    }
  } 
  
   //Finally, the toolbar. We want to check if all buttons make sense.    
    toolbarHTML += "<a id='goProfessional' href='#' onclick='goProfessional();' alt='Versão profissional'><img src='Imagens/professional.jpg' class='editorToolbarButton'></a>";
    
    toolbarHTML += "&nbsp";
   
    if(hasEmptyRows)
      toolbarHTML += "<a id='hideEmptyButton' href='#' onclick='hideEmpty();' alt='Ver campos vazios'><img src='Imagens/empty_rows.jpg' class='editorToolbarButton'></a>";
      
  
  toolbar.innerHTML = toolbarHTML;
    
   //HTML Should be completed and now is inserted into elements and this appended to the final div and delivered      
  banner.appendChild(toolbar);  
  banner.appendChild(navigation);
  bodyDiv.appendChild(banner);
  bodyDiv.appendChild(content);      
  bodyDiv.appendChild(footer); 

  return bodyDiv;
}


function htmlExceptions(internalName, value)
{
  contentHtml = value;
  
  if(value.indexOf("http://") == 0)
  {
    contentHtml = "<a href='" + value + "' target='_blank'><img src='Imagens/document_link.jpg'></a>";
  }                                       
  else if(internalName == "email")
  {
    contentHtml = "<a href=mailto:'" + value + "' target='_blank' class='link'>" + value + "</a>";
  }
  else if(value == "Sim")
  {
    contentHtml = "<img src='Imagens/yes.png' />";
  }
  else if(value == "Não")
  {
    contentHtml = "<img src='Imagens/no.jpg' />";
  }
  else if(internalName == "area_m2")
  {
    contentHtml = NSFunctions.roundNumber(parseFloat(value), 4) + "m<sup>2</sup>";
  }
                
  return contentHtml;
}

function _aux_cleanClassSpaces(sClassName)
{
	var sResult = sClassName;
	
	while(sResult.indexOf(" ")>-1)
	{
		sResult = sResult.replace(/  /g," ");
	}
	
	return sResult
}
function _aux_removeClass(sClassName, sClassToRemove)
{
	var aClasses = sClassName.split(" ");
	var iPos = aClasses.indexOf(sClassToRemove);
	if(iPos > -1)
	{
		aClasses.splice(iPos,1)
	}
	
	var sResult = aClasses.join(" ");
	sResult = _aux_cleanClassSpaces(sResult);
	
	return sResult
}
function _aux_hasClass(sClassName, sClassToFind)
{
	var aClasses = sClassName.split(" ");
	var iPos = aClasses.indexOf(sClassToFind);
	var bResult = (iPos > -1)? true : false;
	return bResult;
}

function selectTab(tabID)
{   
	//In firefox parentNode.childNodes can have length while being undefined
	var b_tabIterator_HasLength = document.getElementById(tabID).parentNode.hasChildNodes();
	var b_pageIterator_HasLength =  document.getElementById("_page:" + tabID.split(":")[1]).parentNode.hasChildNodes()
    var tabIterator = document.getElementById(tabID).parentNode.childNodes;
    var pageIterator =  document.getElementById("_page:" + tabID.split(":")[1]).parentNode.childNodes;  
    
  //if(tabs != null && editorContent != null && tabIterator != null && pageIterator != null)
  if(b_tabIterator_HasLength && b_pageIterator_HasLength)
  {
    //Changes the tab 
    for(var i = 0 ; i < tabIterator.length ; i++)
    {
      var tab = tabIterator[i];
      if(tab.nodeType == "1" && _aux_hasClass(tab.className, "active"))
          tab.className = _aux_removeClass(tab.className, "active");
          
      if(tab.id.split(":")[1]== tabID.split(":")[1])              
          tab.className += " active";
    } 
    
    //Changes the page but maintains the content in case of changes
    for(var i = 0 ; i < pageIterator.length ; i++)
    {
      var aDiv = pageIterator[i];
      if(aDiv.nodeType == "1" && aDiv.className == "on")
          aDiv.className = "off";
      
      if(aDiv.id.split(":")[1] == tabID.split(":")[1])
          if(aDiv.childNodes.length == 1 && aDiv.childNodes[0].id != "") gotoObject(aDiv.childNodes[0].id); else aDiv.className = "on";                           
    }    
  }   
}

function guidGenerator() 
{
    var S4 = function() {
       return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    };
    return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}


function hideEmpty()
{
  var pages = document.getElementsByClassName("detailPage");    
  
  for(var i = 0 ; i < pages.length ; i++)
  {
    var rows = pages[i].getElementsByTagName("tr");
      for(var j = 0 ; j < rows.length ; j++)
      {
        if(rows[j].id == "empty" && rows[j].style.display == 'block')
          rows[j].style.display = 'none';
        else if (rows[j].id == "empty" && rows[j].style.display == 'none')
          rows[j].style.display = 'block';
      }
    
  }
}

function goProfessional()
{
  window.open('http://sig2.cm-cascais.pt/WebClient2?urns=' + MAIN_OBJECT_URN,'_blank');
}

//called from Mapa.js when the infowindow is opened 
function adjustInfoWindowContent_domready(oInfoWindow, bFirstCall)
{
	//document.getElementById("editorContent").style.height = "90px";
	var eDiv_editorBody, eParentDiv, eDiv_editorContent, eUL_Tabs;
	if(NSGlobal.bIE)
	{
		eDiv_editorBody = NSFunctions.getElementsByName("editorBody_windowGUID_" + oInfoWindow.get("id"))[0];
		eParentDiv = eDiv_editorBody.parentElement;
		eDiv_editorContent = NSFunctions.getElementsByName("editorContent_windowGUID_" + oInfoWindow.get("id"))[0];
		eUL_Tabs = NSFunctions.getElementsByName('tabs_ul_windowGUID_' + oInfoWindow.get("id"))[0];

	}
	else
	{
		eDiv_editorBody = document.getElementsByName("editorBody_windowGUID_" + oInfoWindow.get("id"))[0];
		eParentDiv = eDiv_editorBody.parentElement;
		eDiv_editorContent = document.getElementsByName("editorContent_windowGUID_" + oInfoWindow.get("id"))[0];
		eUL_Tabs = document.getElementsByName('tabs_ul_windowGUID_' + oInfoWindow.get("id"))[0];


	}

	if(NSGlobal.bFireFox)
	{
		eUL_Tabs.style.width = "1000px";
	}
	
	if( (!bFirstCall) && (!oInfoWindow.get('bAdjustContent')) )
	{
		return;
	}

	eDiv_editorContent.style.height = (parseInt(eParentDiv.style.height) - 150) + "px";

	return;

}

//called from Mapa.js when the infowindow is closed 
function adjustInfoWindowContent_closeclick(oInfoWindow)
{

	//document.getElementById("editorContent").style.height = "90px";
	var eUL_Tabs;
	if(NSGlobal.bIE)
	{
		eUL_Tabs = NSFunctions.getElementsByName('tabs_ul_windowGUID_' + oInfoWindow.get("id"))[0];

	}
	else
	{
		eUL_Tabs = document.getElementsByName('tabs_ul_windowGUID_' + oInfoWindow.get("id"))[0];
	}

	if(NSGlobal.bFireFox)
	{
		if(eUL_Tabs)
		{
			eUL_Tabs.style.width = "";
		}
	}

	return;

}
