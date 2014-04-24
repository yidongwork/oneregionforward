define([
    "dojo/ready", 
    "dojo/_base/declare",
    "dojo/dom-class",
    "dojo/dom-style",
    "dojo/dom",
    "dojo/query",
    "dijit/registry",
    "dojo/dom-construct",
    "dojo/on",
    "dojo/_base/lang",
    "dojo/_base/array",
    "esri/arcgis/utils",
    "esri/IdentityManager",
    "esri/geometry/Point",
    "esri/geometry/Extent",
    "esri/dijit/Scalebar",
    "esri/lang",
    "dijit/layout/ContentPane",
    "dijit/layout/LayoutContainer",
	
	
	//yy 0413 toolbar
	
	"dijit/Toolbar",
	"dojo/dom-attr",
	"dijit/form/Button",
	"dijit/form/DropDownButton",
	"dijit/DropDownMenu", 
	"dijit/MenuItem",
	"esri/dijit/BasemapGallery",
	"esri/dijit/Bookmarks",
	"esri/map",
	"dojox/layout/FloatingPane",
	"dojo/dom-attr",
	
	//yy 0414
	//print
	"esri/dijit/Print"
],
function(
    ready, 
    declare, 
    domClass, 
    domStyle,
    dom,
    query,
    registry,
    domConstruct,
    on,
    lang,
    array,
    arcgisUtils,
    IdentityManager,
    Point,
    Extent,
    Scalebar,
    esriLang,
    ContentPane,
    LayoutContainer,
	
	//yy
	
	Toolbar,
	domAttr,
	Button,
	DropDownButton,
	DropDownMenu,
	MenuItem,
	BasemapGallery,
	Bookmarks,
	map,
	FloatingPane,
	domAttr,
	
	Print
) {
    return declare("", null, {
	
		//var pFloatingPane;
		
        config: {},
        allResults: null,
        constructor: function(config) {
            //config will contain application and user defined info for the template such as i18n strings, the web map id
            // and application id
            // any url parameters and any application specific configuration information. 
            this.config = config;
            ready(lang.hitch(this, function() {

                //load a color theme 
                var ss = document.createElement("link");
                ss.type = "text/css";
                ss.rel = "stylesheet";
                ss.href = "css/" + this.config.theme + ".css";
                document.getElementsByTagName("head")[0].appendChild(ss);

                //supply either the webmap id or, if available, the item info 
                var itemInfo = this.config.itemInfo || this.config.webmap;

                this._createWebMap(itemInfo);
            }));
        },
        _mapLoaded: function() {
          //apply the theme to the popups 
          domClass.add(this.map.infoWindow.domNode,  this.config.theme);

          //add the scalebar 
          var scalebar = new Scalebar({
            map: this.map,
            scalebarUnit: this.config.units 
          });


          //add optional widgets 
         if(this.config.home_button){//Add the home button to the small slider 
             require(["esri/dijit/HomeButton", "dojo/query"], lang.hitch(this,function(HomeButton,query){
                var homeButton = new HomeButton({
                    map: this.map
                }, domConstruct.create("div",{},query(".esriSimpleSliderIncrementButton")[0], "after"));
                homeButton.startup();
            }));
         }




         if(this.config.locate_button){
            require(["esri/dijit/LocateButton"], lang.hitch(this,function(LocateButton){
                //add the location button as a child of the map div. This button
                //is positioned using css. Search main.css for the locateDiv selector
                var locateDiv = domConstruct.create("div",{id:"locateDiv"},"mapDiv");
                var locationButton = new LocateButton({
                    map: this.map
                },locateDiv);
                locationButton.startup();
            }));
         }

        if(this.config.geocoder){
            this._createGeocoder();
        }

		//yy 0413
		//create logo
		if(this.config.logoPath)
		{			
			this.CreateLogo(this.config.logoPath);
		}
		
		//yy 0413
		//create toolbar
		this.CreateToolBar();


        },
        _createGeocoder: function (){
            require(["esri/dijit/Geocoder"], lang.hitch(this,function(Geocoder){
                //add the geocoder widget as a child of the map div. This widget
                //is positioned using css. Search main.css for the geocoderDiv selector

                var options = this._createGeocoderOptions();

                var geocoderDiv = domConstruct.create("div",{id:"geocoderDiv"},"mapDiv");
                var geocoder = new Geocoder(options,geocoderDiv);


                geocoder.startup();

                geocoder.on("find-results", lang.hitch(this, this.checkResults)); 
                geocoder.on("select", lang.hitch(this, this.showGeocodingResult));
                geocoder.on("auto-complete", lang.hitch(this, this.clearGeocodeResults));
                geocoder.on("clear", lang.hitch(this, this.clearGeocodeResults));



            }));
        },
        checkResults: function(geocodeResults){
            this.allResults = null;
            if (geocodeResults && geocodeResults.results && geocodeResults.results.results) {
                geocodeResults.results = geocodeResults.results.results;
            }
            if ((!geocodeResults || !geocodeResults.results || !geocodeResults.results.length)) {
                //No results
                console.log("No results found");
            } else if (geocodeResults) {
                this.allResults = geocodeResults.results;
            }
        },
        clearGeocodeResults: function(){
            if(this.map.infoWindow.isShowing){
                this.map.infoWindow.hide();
            }
            this.allResults = null;

        },
        showGeocodingResult: function(geocodeResult, pos) {
            if (!esriLang.isDefined(pos)) {
                pos = 0;
            }

            if (geocodeResult.result) {
                geocodeResult = geocodeResult.result;
            }

            if (geocodeResult.extent) {
                this.setupInfoWindowAndZoom(geocodeResult.name, geocodeResult.feature.geometry, geocodeResult.extent, geocodeResult, pos);
            } else { //best view 
                var bestView = this.map.extent.centerAt(geocodeResult.feature.geometry).expand(0.0625);
                this.setupInfoWindowAndZoom(geocodeResult.name, geocodeResult.feature.geometry, bestView, geocodeResult, pos);
            }
        },  
        setupInfoWindowAndZoom: function(content, geocodeLocation, newExtent, geocodeResult, pos) {
            this.map.infoWindow.clearFeatures();

            //Show info window
            if (this.allResults && this.allResults.length > 1) {
                    //let's update the content to show additional results 
                var currentLocationName = content;
                var attr = this.allResults[pos].feature.attributes;
                content = "<div id='geocodeCurrentResult' style='display:none;'><span style='font-weight:bold;'>";
                content += "Current Location";//this.config.i18n.viewer.main.search.currentLocation;
                content += "</span></div>";
                content += "<span>";

                if (!attr.Match_addr) {
                    content += currentLocationName;
                } else {
                    content += attr.Match_addr;
                    if (attr.stAddr && attr.City) {
                        content += " - " + attr.stAddr + ", " + attr.City;
                    } else if (attr.stAddr) {
                        content += " - " + attr.stAddr;
                    }
                }

                content += "</span>";
                content += "<div id='geocodeWantOtherResults'>";
                content += "<a id='results' style='cursor:pointer'>";

                content += "Not what you wanted?";//this.config.i18n.viewer.main.search.notWhatYouWanted;
                content += "</a>";
                content += "</div>";
                content += "<div id='geocodeOtherResults' style='display:none;'><span style='font-weight:bold;'>";
                content += "Select another location";//this.config.i18n.viewer.main.search.selectAnother;
                content += "</span><br/>";
                for (var i = 0; i < this.allResults.length; i++) {
                    if (i !== pos) {
                        var result = this.allResults[i];
                        attr = result.feature.attributes;
                        content += "<a style='cursor:pointer' class='li_item' id=" + i + ">"; 
               
                        if (!attr.Match_addr) {
                            content += result.name;
                        } else {
                            //content += result.feature.attributes.Place_addr ? (" - " + result.feature.attributes.Place_addr) : ""
                            content += attr.Match_addr;
                            if (attr.stAddr && attr.City) {
                                content += " - " + attr.stAddr + ", " + attr.City;
                            } else if (attr.stAddr) {
                                content += " - " + attr.stAddr;
                            }
                        }

                        content += "</a><br/>";
                    }
                }
                content += "</div>";

            }

            //display a popup for the result
            //this.config.i18n.viewer.main.search.popupTitle
            this.map.infoWindow.setTitle("Location");

            this.map.infoWindow.setContent(content);
            query(".li_item").forEach(lang.hitch(this, function(node){
                on(node, "click", lang.hitch(this, function(){
                    if(node.id >= 0){
                        this.selectAnotherResult(node.id);
                    }
                }));

            }));
            var resDiv = dom.byId("results");
            if(resDiv){
                on(resDiv,"click",lang.hitch(this, function(){
                    this.showOtherResults();
                }));
            }

    
 



            var location = new Point(geocodeLocation.x, geocodeLocation.y, geocodeLocation.spatialReference);
            on.once(this.map, "extent-change", lang.hitch(this, function(){
                this.map.infoWindow.show(location);
            }));
            this.map.setExtent(newExtent);


        },      
        showOtherResults: function() {
        
            domStyle.set(dom.byId("geocodeWantOtherResults"), "display", "none");
            domStyle.set(dom.byId("geocodeCurrentResult"), "display", "block");
            domStyle.set(dom.byId("geocodeOtherResults"), "display", "block");

        },
        selectAnotherResult: function(pos) {
            this.showGeocodingResult(this.allResults[pos], pos);
        },
        _createGeocoderOptions: function(){
            //Check for multiple geocoder support and setup options for geocoder widget. 
            var hasEsri = false,
                geocoders = lang.clone(this.config.helperServices.geocode);

            array.forEach(geocoders, function (geocoder, index) {
                if (geocoder.url.indexOf(".arcgis.com/arcgis/rest/services/World/GeocodeServer") > -1) {
                    hasEsri = true;
                    geocoder.name = "Esri World Geocoder";
                    geocoder.outFields = "Match_addr, stAddr, City";
                    geocoder.singleLineFieldName = "Single Line";
                    geocoder.esri = geocoder.placefinding = true;
  
                }

            });
            //only use geocoders with a singleLineFieldName that allow placefinding
            geocoders = array.filter(geocoders, function (geocoder) {
                return (esriLang.isDefined(geocoder.singleLineFieldName) && esriLang.isDefined(geocoder.placefinding) && geocoder.placefinding);
            });
            var esriIdx;
            if (hasEsri) {
                for (var i = 0; i < geocoders.length; i++) {
                    if (esriLang.isDefined(geocoders[i].esri) && geocoders[i].esri === true) {
                        esriIdx = i;
                        break;
                    }
                }
            }
            var options = {
                map: this.map,
                autoNavigate: false,
                theme: "simpleGeocoder",
                autoComplete:hasEsri

            }
   
   
            if (hasEsri && esriIdx === 0) {

                options.minCharacters = 0;
                options.maxLocations = 5;
                options.searchDelay = 100
                options.arcgisGeocoder = geocoders.splice(0, 1)[0]; //geocoders[0];
                if (geocoders.length > 0) {
                    options.geocoders = geocoders;
                }
            } else {
                //options.autoComplete = false;
                options.arcgisGeocoder = false;
                options.geocoders = geocoders;
            }

            return options;


        },
        //create a map based on the input web map id
        _createWebMap: function(itemInfo) {
            arcgisUtils.createMap(itemInfo , "mapDiv", {
                mapOptions: {
                    //Optionally define additional map config here for example you can 
                    //turn the slider off, display info windows, disable wraparound 180, slider position and more. 
                },
                bingMapsKey: this.config.bingmapskey
            }).then(lang.hitch(this, function(response) {
                //Once the map is created we get access to the response which provides important info 
                //such as the map, operational layers, popup info and more. This object will also contain
                //any custom options you defined for the template. In this example that is the 'theme' property.
                //Here' we'll use it to update the application to match the specified color theme.  
   
               this.map = response.map;
               
               
           
               //set the application title 
               document.title = this.config.title || response.itemInfo.item.title;

               //Define the layout 
               //Header 
                if(this.config.header){
                    //add a header 
                    var title = (this.config.title) ?  this.config.title : response.itemInfo.item.title;
                    var subtitle = (this.config.subtitle) ? this.config.subtitle : response.itemInfo.item.snippet;

                    var content = esriLang.substitute({"title": title, "subtitle": subtitle}, "<div id='title'>${title}</div><div id='subtitle'>${subtitle}</div>")
                    this._addContentPane("header","top", content, null);
                }
                //Footer 
                if(this.config.footer){
                   //add a footer 
                    var footerText = (this.config.footer_text) ? this.config.footer_text : null;
                    if(footerText){
                        var footerContent = "<span>" + footerText + "</span>";
                        this._addContentPane("footer", "bottom", footerContent, null);
                    }
                }

                //If both legend and description and same side then flip the legend to the other side. Consider alternatives here? 
                //add a description 
                if(this.config.description){
                    var descriptionContent = (this.config.description_content) ? this.config.description_content : response.itemInfo.item.description;
                    if(descriptionContent){
                        domConstruct.create("div",{
                            innerHTML: descriptionContent
                        });
                        this._addContentPane("descriptionPane",this.config.description_side,descriptionContent, "panel_content");
                    }

                }
                //add a legend 
                if(this.config.legend){
                   require(["esri/dijit/Legend"], lang.hitch(this,function(Legend){
                      var legendContent = "<div id='legendDiv'></div>";

                      //Check to see if we already have content on the specified side. If we do flip it
                      if(this.config.legend_side === this.config.description_side && this.config.description){
                        this.config.legend_side = (this.config.legend_side === "left") ? "right" : "left";
                      }
                      this._addContentPane("legendPane",this.config.legend_side,legendContent,"panel_content");
         
                      var legend = new Legend({
                        map: this.map,
                        layerInfos: (arcgisUtils.getLegendLayers(response))
                      },"legendDiv");
                      legend.startup();


                   }));
                }

                if (this.map.loaded) {
                    // do something with the map
                    this._mapLoaded();
                } else {
                    on(this.map, "load", lang.hitch(this, function() {
                        // do something with the map
                        this._mapLoaded();
                    }));
                }

                //refresh the layout to catch changes
                var bc = registry.byId("mainWindow");
                bc.resize();
				
				


            }), lang.hitch(this, function(error) {
                //an error occurred - notify the user. In this example we pull the string from the 
                //resource.js file located in the nls folder because we've set the application up 
                //for localization. If you don't need to support mulitple languages you can hardcode the 
                //strings here and comment out the call in index.html to get the localization strings. 
                if (this.config && this.config.i18n) {
                    alert(this.config.i18n.viewer.errors.createMap + ": " + error.message);
                } else {
                    alert("Unable to create map: " + error.message);
                }
            }));
        },
        _addContentPane: function(widgetId, region, content, customClass){
  
            //add content pane to the border container 
            var bc = registry.byId("mainWindow");
            var cp = new ContentPane({
                    id: widgetId,
                    className: widgetId,
                    region: region,
                    content: content
            },domConstruct.create("div"));
           
            if(customClass){
                domClass.add(cp.domNode, customClass);
            }

            bc.addChild(cp);
            
            return cp;

        },
		
		CreateLogo:function(logoPath){
			//yy 0413 create logo
			
			//<a id="logo" href="http://www.oneregionforward.org">
				//<img class="logoImg" alt="One Region Forward" src="image/logo.svg"></img>
			//</a>
			
			var content;
			content="<a id='logo' href='http://www.oneregionforward.org'>"
			content+="<img ";
			content+="alt='logo image' src='"+logoPath+"' style='width:100px;height:50px'></img>";
			content+="</a>";
			var n = domConstruct.create("div", {id:"logoDiv", innerHTML: content },"mapDiv");
			
		},
		
		CreateToolBar:function()
		{
			var width=domAttr.get("toolbar", "width");
			
			this.CreateLayerListBtn();
			this.CreateBaseMapBtn();
			this.CreateBookmarkBtn();
			this.CreatePrintBtn();
			this.CreateDrawBtn();
			
			//width+=100;
			//domAttr.set("toolbar","width",width);
		},
		
		CreateLayerListBtn:function()
		{
			var n = domConstruct.create("div", {id:"LayerListBtn"},"toolbar");
			
			//var cp = new ContentPane({
			//	id: 'layerListPane',
			//	style:"background-color:#ffffff;width:100px;height:100px;"
			//});

			//var cp = dom.byId("layerlistPane");
			
			/*pFloatingPane = new FloatingPane({
		        title: "A floating pane",
		        resizable: true,
		        dockable: true,
		        style: "position:absolute;top:300px;left:50px;width:200px;height:300px;visibility:hidden;z-index:1000;",
		        id: "layerListFloatingPane"
		    },"layerListFloatingPane");
		    //dojo.byId("pFloatingPane"));*/
		
		    //pFloatingPane.startup();    
			
			var myButton = new Button({
				label: "layer list",
				id: "layerlistButton",
				iconClass: "layerIcon",
				showLabel:false,
				title: "layerlist title",
				onClick: function(){ 
					var isvisible=domAttr.get("layerlistFloatingPane","visibility");
					if(isvisible=="hidden"){
						domAttr.set("layerlistFloatingPane","visibility","visible"); 
					}
					else{
						domAttr.set('layerlistFloatingPane','visibility','hidden');
					}
					
					
					}
				//dropDown:layerlistFloatingPane
			}, n);
			
			
			
			//domAttr.set(cp,"innerHTML","aweraer");
			
			//var toc=domConstruct.create("div",{id:"toc",innerHTML:"qweqwe"},"layerListPane");
			
			//toc.innerHTML="asdasd";
			
			//cp.set("content",toc.domNode);
			
				
			
			
			
			
			//toc = dom.byId('toc');
			//console.log(toc.innerHTML);
			
			
			//yy 0413
			//add to layer list
			//this.getLayerProperties();
			
			//dom.byId("toc").innerHTML = tocHTML;
			//on(myButton, "click",function(){
				//this.addToTOC(this.map.getLayer(this.map.layerIds[0]),false);
			//});
			
			
			
			
		},
		
		//yy 0413
		//basemapbtn
		CreateBaseMapBtn:function()
		{
			var n = domConstruct.create("div", {id:"basemapBtn"},"toolbar");
			
			
			var cp=new ContentPane({
				id:"basemapGallery",
				style:"max-height:448px;width:380px;background-color:#ffffff"
			});
			
			var basemapGallery = new BasemapGallery({
				showArcGISBasemaps:true,
				map:this.map
			},domConstruct.create('div'));
			
			cp.set('content', basemapGallery.domNode);
			
			var button = new dijit.form.DropDownButton({
				label: "Basemap Gallery",
				iconClass:'basemapIcon',
				showLabel:false,
				//title: i18n.tools.basemap.title,
				dropDown: cp
			},n);
			
			//addbookmark widget
			//contentpane
			//basemapgallery
			//
			/*
			var cp = new dijit.layout.ContentPane({
				id: 'basemapGallery',
				style: "max-height:448px;width:380px;"
			});
			
			var basemapGallery = new BasemapGallery({
				showArcGISBasemaps:true,
				map:map
			},dojo.create('div'));

			//if a bing maps key is provided - display bing maps too.
			var basemapGallery = new esri.dijit.BasemapGallery({
				showArcGISBasemaps: true,
				portalUrl: configOptions.sharingurl,
				basemapsGroup: getBasemapGroup(),
				bingMapsKey: configOptions.bingmapskey,
				map: map
			}, dojo.create('div'));


			cp.set('content', basemapGallery.domNode);


			var button = new dijit.form.DropDownButton({
				label: i18n.tools.basemap.label,
				id: "basemapBtn",
				iconClass: "esriBasemapIcon",
				title: i18n.tools.basemap.title,
				dropDown: cp
			});

			dojo.byId('webmap-toolbar-center').appendChild(button.domNode);

			dojo.connect(basemapGallery, "onSelectionChange", function () {
				//close the basemap window when an item is selected
				//destroy and recreate the overview map  - so the basemap layer is modified.
				destroyOverview();
				dijit.byId('basemapBtn').closeDropDown();
			});

			basemapGallery.startup();
			
			*/
		},
		
		//yy 0413
		//bookmark
		CreateBookmarkBtn:function()
		{
			var n = domConstruct.create("div", {id:"bookmarkBtn"},"toolbar");
			
			var bookmarks=new Bookmarks({
				map:this.map,
				bookmarks: [],
				editable: true
			},domConstruct.create('div'));
			
			var cp = new ContentPane({
				id: 'bookmarkView',
				style:"background-color:#ffffff"
			});
			
			on(bookmarks, "onClick", function () {
				//close the bookmark window when an item is clicked
				dom.byId('bookmarkButton').closeDropDown();
			});

			cp.set('content', bookmarks.bookmarkDomNode);
			var button = new DropDownButton({
				label: "Bookmarks",
				id: "bookmarkButton",
				iconClass: "bookmarkIcon",
				showLabel:false,
				title: "Bookmarks title",
				dropDown: cp
			},n);
			
			/*
			//does the web map have any bookmarks
				if (info.itemInfo.itemData.bookmarks) {
					var bookmarks = new esri.dijit.Bookmarks({
						map: map,
						bookmarks: info.itemInfo.itemData.bookmarks
					}, dojo.create("div"));


					dojo.connect(bookmarks, "onClick", function () {
						//close the bookmark window when an item is clicked
						dijit.byId('bookmarkButton').closeDropDown();
					});


					var cp = new dijit.layout.ContentPane({
						id: 'bookmarkView'
					});
					cp.set('content', bookmarks.bookmarkDomNode);
					var button = new dijit.form.DropDownButton({
						label: i18n.tools.bookmark.label,
						id: "bookmarkButton",
						iconClass: "esriBookmarkIcon",
						title: i18n.tools.bookmark.title,
						dropDown: cp
					});

					dojo.byId('webmap-toolbar-center').appendChild(button.domNode);
				}
			*/
		},
		
		//yy 0413
		//print list
		
		/*
		MAP_ONLY
		A3 Landscape
		A3 Portrait
		A4 Landscape
		A4 Portrait
		Letter ANSI A Landscape
		Letter ANSI A Portrait
		Tabloid ANSI B Landscape
		Tabloid ANSI B Portrait
		*/
		CreatePrintBtn:function()
		{
			printUrl = "http://sampleserver6.arcgisonline.com/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task";

			
			var n = domConstruct.create("div", {id:"printBtn"},"toolbar");	
			
			var menu = new DropDownMenu({ style: "display: none;"});
			var menuItem1 = new MenuItem({
				label: "MAP_ONLY",
				//iconClass:"dijitEditorIcon dijitEditorIconSave",
				onClick: function(){ alert(this.map.layerIds[0]); }
			});
			menu.addChild(menuItem1);

			var menuItem2 = new MenuItem({
				id:"printA3Landscape",
				label: "A3 Landscape",
				//iconClass:"dijitEditorIcon dijitEditorIconCut",
				onClick: function(){ alert('cut'); }
			});
			menu.addChild(menuItem2);
			
			var menuItem3 = new MenuItem({
				label: "A3 Portrait",
				//iconClass:"dijitEditorIcon dijitEditorIconCut",
				onClick: function(){ alert('cut'); }
			});
			menu.addChild(menuItem3);
			
			var menuItem4 = new MenuItem({
				label: "A4 Landscape",
				//iconClass:"dijitEditorIcon dijitEditorIconCut",
				onClick: function(){ alert('cut'); }
			});
			menu.addChild(menuItem4);
			
			var menuItem5 = new MenuItem({
				label: "A4 Portrait",
				//iconClass:"dijitEditorIcon dijitEditorIconCut",
				onClick: function(){ alert('cut'); }
			});
			menu.addChild(menuItem5);
			
			var menuItem6 = new MenuItem({
				label: "Letter ANSI A Landscape",
				//iconClass:"dijitEditorIcon dijitEditorIconCut",
				onClick: function(){ alert('cut'); }
			});
			menu.addChild(menuItem6);
			
			var menuItem7 = new MenuItem({
				label: "Letter ANSI A Portrait",
				//iconClass:"dijitEditorIcon dijitEditorIconCut",
				onClick: function(){ alert('cut'); }
			});
			menu.addChild(menuItem7);
			
			var menuItem8 = new MenuItem({
				label: "Tabloid ANSI B Landscape",
				//iconClass:"dijitEditorIcon dijitEditorIconCut",
				onClick: function(){ alert('cut'); }
			});
			menu.addChild(menuItem8);
			
			var menuItem9 = new MenuItem({
				label: "Tabloid ANSI B Portrait",
				//iconClass:"dijitEditorIcon dijitEditorIconCut",
				onClick: function(){ alert('cut'); }
			});
			menu.addChild(menuItem9);

			var button = new DropDownButton({
				label: "print map document",
				iconClass:'printIcon',
				showLabel:false,
				dropDown: menu,
				onClick: function(){
					// Do something:
					console.log("button clicked")
				}
			}, n);
			
			/*this.printer=new Print({
				map:this.map,
				url:printUrl
			},domConstruct.create('span'));
			
			dom.byId('toolbar').appendChild(this.printer.printDomNode);
			
			this.printer.startup();*/
			
			
		},
		
		CreateDrawBtn:function()
		{
			//<button data-dojo-type="dijit/form/Button">Point</button>
			//<button data-dojo-type="dijit/form/Button">Multi Point</button>
			//<button data-dojo-type="dijit/form/Button">Line</button>
			//<button data-dojo-type="dijit/form/Button">Polyline</button>
			//<button data-dojo-type="dijit/form/Button">Polygon</button>
			//<button data-dojo-type="dijit/form/Button">Freehand Polyline</button>
			//<button data-dojo-type="dijit/form/Button">Freehand Polygon</button>
			
			var n = domConstruct.create("div", {id:"DrawBtn"},"toolbar");	
			
			var menu = new DropDownMenu({ style: "display: none;"});
			var menuItem1 = new MenuItem({
				label: "Point",
				//iconClass:"dijitEditorIcon dijitEditorIconSave",
				onClick: function(){ alert('save'); }
			});
			menu.addChild(menuItem1);

			var menuItem2 = new MenuItem({
				label: "Multi Point",
				//iconClass:"dijitEditorIcon dijitEditorIconCut",
				onClick: function(){ alert('cut'); }
			});
			menu.addChild(menuItem2);
			
			var menuItem3 = new MenuItem({
				label: "Line",
				//iconClass:"dijitEditorIcon dijitEditorIconCut",
				onClick: function(){ alert('cut'); }
			});
			menu.addChild(menuItem3);
			
			var menuItem4 = new MenuItem({
				label: "Polyline",
				//iconClass:"dijitEditorIcon dijitEditorIconCut",
				onClick: function(){ alert('cut'); }
			});
			menu.addChild(menuItem4);
			
			var menuItem5 = new MenuItem({
				label: "Polygon",
				//iconClass:"dijitEditorIcon dijitEditorIconCut",
				onClick: function(){ alert('cut'); }
			});
			menu.addChild(menuItem5);
			
			var menuItem6 = new MenuItem({
				label: "Freehand Polyline",
				//iconClass:"dijitEditorIcon dijitEditorIconCut",
				onClick: function(){ alert('cut'); }
			});
			menu.addChild(menuItem6);
			
			var menuItem7 = new MenuItem({
				label: "Freehand Polygon",
				//iconClass:"dijitEditorIcon dijitEditorIconCut",
				onClick: function(){ alert('cut'); }
			});
			menu.addChild(menuItem7);

			var button = new DropDownButton({
				label: "draw graphics",
				iconClass:'drawIcon',
				showLabel:false,
				dropDown: menu,
				onClick: function(){
					// Do something:
					console.log("button clicked")
				}
			}, n);
		},
    
		//**************************************************************
		//TOC FUNCTIONS

		addToTOC:function(layer,listLayers)
		{
			if(listLayers)
			{
				if (layer.loaded) {
					this.buildLayerList(layer);
				}
				else {
					on(layer, "onLoad", this.buildLayerList);
				}
			}
			else
			{
				if (layer.loaded) {
					this.buildLayerListRoot(layer);
				}
				else {
					on(layer, "onLoad", this.buildLayerListRoot);
				}
			}
		},

		toggleService:function(layerID)
		{
			var layer = this.map.getLayer(layerID);
			if(layer.visible)
			{
				layer.hide();
			}
			else
			{
				layer.show();
			}
		},
		
		buildLayerListRoot:function(layer)
		{
			//var toc=domConstruct.create("div",{id:"toc",innerHTML:"qweqwe"});
			//addToTransparencyList(layer);
			var currentLayer = layer;
			var tocHTML = "<img src='images/blank.bmp'><input type='checkbox' dojotype='dijit/form/CheckBox' class='TOC_Root' " + (currentLayer.visible ? " CHECKED " : "") + " id='" + currentLayer.id + "' onclick=\"toggleService('" + currentLayer.id + "');\" /><label for='" + currentLayer.id + "'>" + currentLayer.id + "</label><br>" + tocHTML;
			//var toc = dom.byId('toc');
			//console.log(toc.innerHTML);
			//tocHTML = "<input id='" + currentLayer.id + "' dojotype='dijit/form/CheckBox' class='TOC_Root' name='developer' " + (currentLayer.visible ? " CHECKED " : "") + " value='on' type='checkbox' onclick=\"toggleService('" + currentLayer.id + "');\" /><label for='" + currentLayer.id + "'>" + currentLayer.id + "</label>"  + tocHTML; 
			domAttr.set('toc', "innerHTML", tocHTML);
		},

		toggleLayer:function(id)
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

		},

		zoomToLayer:function(id)
		{
			var layer = this.map.getLayer(id);
			if(layer != null)
			{
				this.map.setExtent(layer.fullExtent);
			}
		},

		buildLayerList:function(layer) {
			
			//addToTransparencyList(layer);
			var currentLayer = layer;
			var currentHTML = "";
			currentHTML += "<img src='images/expand.bmp' id='" + currentLayer.id + "Icon' onclick=\"toggleLayer('" + currentLayer.id + "')\" ><input type='checkbox' dojotype='dijit.form.CheckBox' class='TOC_Root' " + (currentLayer.visible ? " CHECKED " : "") + " id='" + currentLayer.id + "' onclick=\"toggleService('" + currentLayer.id + "');\" /><label for='" + currentLayer.id + "'>" + currentLayer.id + "</label><br>";
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
		},



		updateLayerVisibility:function(serviceID,layerid) {
			/*
			var inputs = dojo.query("."+serviceID+"TOC"), input;
			visible = [];
			for (var i=0, il=inputs.length; i<il; i++) {
			if (inputs[i].checked) {
			visible.push(inputs[i].id);
			}
			}
			
			var layer = map.getLayer(serviceID);
			layer.setVisibleLayers(visible);
			*/
		},

		
		//END TOC FUNCTIONS
		//**************************************************************
		
		getLayerProperties:function() {

		  for(var j = 0; j < this.map.layerIds.length; j++) {

			var layer = this.map.getLayer(this.map.layerIds[j]);

			alert(layer.id + ' ' + layer.opacity + ' ' + layer.visible);

		  }

}
		
	});
});
