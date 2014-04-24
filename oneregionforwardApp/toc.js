var tocHTML;
function addToTOC(layer,listLayers)
{
	if(listLayers)
	{
		if (layer.loaded) {
			buildLayerList(layer);
		}
		else {
			on(layer, "onLoad", buildLayerList);
		}
	}
	else
	{
		if (layer.loaded) {
			buildLayerListRoot(layer);
		}
		else {
			on(layer, "onLoad", buildLayerListRoot);
		}
	}
}

function buildLayerListRoot(layer)
{
	addToTransparencyList(layer);
	var currentLayer = layer;
	tocHTML = "<img src='images/blank.bmp'><input type='checkbox' data-dojo-type='dijit/form/CheckBox' class='TOC_Root' " + (currentLayer.visible ? " CHECKED " : "") + " id='" + currentLayer.id + "' onclick=\"toggleService('" + currentLayer.id + "');\" /><label for='" + currentLayer.id + "'>" + currentLayer.id + "</label><br>" + tocHTML;
	//tocHTML = "<input id='" + currentLayer.id + "' dojotype='dijit.form.CheckBox' class='TOC_Root' name='developer' " + (currentLayer.visible ? " CHECKED " : "") + " value='on' type='checkbox' onclick=\"toggleService('" + currentLayer.id + "');\" /><label for='" + currentLayer.id + "'>" + currentLayer.id + "</label>"  + tocHTML; 
	dom.byId("toc").innerHTML = tocHTML;
}

function toggleLayer(id)
{
	var layerDiv = dojo.byId(id+'Layers');
	var icon = dojo.byId(id+'Icon');
	if(layerDiv.style.display == 'block')
	{
		icon.src = "images/expand.bmp";
		layerDiv.style.display = 'none';
	}
	else
	{
		icon.src = "images/close.bmp";
		layerDiv.style.display = 'block';
	}

}

function zoomToLayer(id)
{
	var layer = map.getLayer(id);
	if(layer != null)
	{
		map.setExtent(layer.fullExtent);
	}
}

function buildLayerList(layer) {
	
	addToTransparencyList(layer);
	var currentLayer = layer;
	var currentHTML = "";
	currentHTML += "<img src='images/expand.bmp' id='" + currentLayer.id + "Icon' onclick=\"toggleLayer('" + currentLayer.id + "')\" ><input type='checkbox' data-dojo-type='dijit/form/CheckBox' class='TOC_Root' " + (currentLayer.visible ? " CHECKED " : "") + " id='" + currentLayer.id + "' onclick=\"toggleService('" + currentLayer.id + "');\" /><label for='" + currentLayer.id + "'>" + currentLayer.id + "</label><br>";
	var subLayers = currentLayer.layerInfos;
	currentHTML += "<div id='" + currentLayer.id + "Layers' style='display:none;'>";
	for (var i=0; i<subLayers.length; i++)
	{
	  var currentSubLayer = subLayers[i];
	  if (currentSubLayer.defaultVisibility) {
		visible.push(currentSubLayer.id);
	  }
	  currentHTML += "<img src='images/blank.bmp'><img src='images/blank.bmp'><input type='checkbox' class='" + currentLayer.id + "TOC' " + (currentSubLayer.defaultVisibility ? " CHECKED " : "") + " id='" + currentSubLayer.id + "' onclick=\"updateLayerVisibility('" + currentLayer.id + "','" + currentSubLayer.id + "');\" /><label for='" + currentSubLayer.id + "'>" + currentSubLayer.name + "</label><br>";
	}
	currentHTML += "</table></div>";
	
	tocHTML = currentHTML + tocHTML;
	
	dojo.byId("toc").innerHTML = tocHTML;
}



function updateLayerVisibility(serviceID,layerid) {
	var inputs = dojo.query("."+serviceID+"TOC"), input;
	visible = [];
	for (var i=0, il=inputs.length; i<il; i++) {
	if (inputs[i].checked) {
	visible.push(inputs[i].id);
	}
	}
	
	var layer = map.getLayer(serviceID);
	layer.setVisibleLayers(visible);
}

function toggleService(layerID)
{
	var layer = map.getLayer(layerID);
	if(layer.visible)
	{
		layer.hide();
	}
	else
	{
		layer.show();
	}
}
//END TOC FUNCTIONS
//**************************************************************


//**************************************************************
//Transparency FUNCTIONS

function addToTransparencyList(layer)
{
	var selectObject = dom.byId("transparencyList");	
	var optionObject = new Option(layer.id,layer.id);
	selectObject.options[selectObject.options.length]=optionObject;
	
	var list = new Array();
	for(var i= 0; i < selectObject.options.length;i++)
	{
		list.push(selectObject.options[i].value);
	}
	
	selectObject.options.length = 0;
	list.sort();
	for(var j= 0; j < list.length;j++)
	{
		var optionObject = new Option(list[j],list[j]);
		selectObject.options[selectObject.options.length]=optionObject;
	}
}

function updateTransparencyLayer(layerId)
{
	transparencyLayerID = layerId;
	var layer = map.getLayer(transparencyLayerID);
	if(layer != null)
	{
		dijit.byId('slider').setValue(layer.opacity * 100);
	}
}

function changeTransparency(value)
{
	
	var layer = map.getLayer(transparencyLayerID);
	if(layer != null)
	{
		layer.setOpacity(value);
	}
}
//END Transparency FUNCTIONS
//**************************************************************