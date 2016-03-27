// create the base map to which other layers will be added
// and the markers layer on which we'll add all relevant points
var globalMap = '';
var globalMarkers = '';

var initializeMap = function() {

  // add basemap to the map; make the centered portion
  // of the map a function of the user's screen size
  // 1440 = macbook pro, > 1800 = 27" wide
  var centerCoordinates = '';
  if ($(window).width() > 1800) {
    centerCoordinates = new L.LatLng(48.85, 18.35);
  } else {
    centerCoordinates = new L.LatLng(45.85, 7.85);
  }

  var map = new L.Map("map", {
    center: centerCoordinates,
    zoom: 5,
    maxZoom: 20,
    minZoom: 3
  });

  /***********
  * Base Map *
  ***********/

  // add map layer for black and white background
  map.addLayer(new L.tileLayer("http://korona.geog.uni-heidelberg.de/tiles/roadsg/x={x}&y={y}&z={z}", {
    attribution: 'Imagery from <a href="http://giscience.uni-hd.de/">' +
        'GIScience Research Group @ University of Heidelberg</a> &mdash; ' +
        'Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }));

  /********************
  * Shapefile overlay *
  ********************/

  // add a map layer with the colored background tiles
  d3.json("/json/geojson/europeanCountries.geojson", function(error, json) {
    if (error) return console.warn(error);
 
    // define function that can be used to set fill values as
    // a function of a given shapefile's density value
    function getColor(d) {
      return d > 1000 ? '#800026' :
             d > 500  ? '#BD0026' :
             d > 200  ? '#E31A1C' :
             d > 100  ? '#FC4E2A' :
             d > 50   ? '#FD8D3C' :
             d > 20   ? '#FEB24C' :
             d > 10   ? '#FED976' :
                        '#FFEDA0';
    }

    // add function that will use the color function above to set a 
    // given shapefile's fill value
    function style(feature) {
      return {
          fillColor: getColor(feature.properties.density),
          weight: 2,
          opacity: .3,
          color: 'white',
          dashArray: '3',
          fillOpacity: 0.1
      };
    }

    // add the geoJson with data to the map
    L.geoJson(json, {style: style}).addTo(map);    
  
  }); /* closes geojson load */

  /****************
  * Image Overlay *
  ****************/

  // specify the path to the tms image tiles to be overlaid on the map
  var imageTileUrl = "https://s3.amazonaws.com/eeb-map/carl-radefeld-1843-tiles/{z}/{x}/{y}.png";

  // add the image tiles to the map
  var imageTileLayer = L.tileLayer(imageTileUrl, {
    attribution: "",
    opacity: .6,
    // set max zoom to prevent requests for tiles that don't exist
    maxZoom: 7,
    tms: true,
    // also set bounds to prevent 404's from appearing when
    // the client requests image tiles from relevant zoom levels
    // if those tiles don't exist
    bounds: [
      L.latLng(20,-45),
      L.latLng(70, 90)
      ]
  }).addTo(map);

  // add a class to the image tile layer for dynamic css styling
  $(imageTileLayer.getContainer()).addClass('imageTileLayer');

  // add an opacity slider to the imageTileLayer
  var opacitySlider = new L.Control.opacitySlider();
    map.addControl(opacitySlider);
    opacitySlider.setOpacityLayer(imageTileLayer);

  /*********************
  * Add marker cluster *
  **********************/

  var markers = L.markerClusterGroup();

  /**********************
  * Add initial markers *
  ***********************/

  // add the points to the populated map
  d3.json("/json/page_load_book_locations.json", function(error, bookLocationJson) {
    if (error) return console.warn(error);
   
    // retrieve book location json and add to the map
    for (i = 0; i < bookLocationJson.length; i++) {

      // manually add marker point to map for the current location
      var locationLat = bookLocationJson[i].lat;
      var locationLng = bookLocationJson[i].lng;
      var bookId = bookLocationJson[i].id;
      var classificationId = bookLocationJson[i].classificationId;
      var languageId = bookLocationJson[i].languageId;
      var pubYear = bookLocationJson[i].year;

      // add book id and classification id to the circle's class values
      markers.addLayer(

        L.marker(
          [locationLat, locationLng], 
          {
            icon: L.AwesomeMarkers.icon(
              {
                icon: 'book', 
                prefix: 'fa', 
                markerColor: 'blue', 
                iconColor: '#ffffff',

                // preface user-supplied classes with awesome-marker
                className: "awesome-marker mapPoint" +
                  " bookId" + String(bookId) + 
                  " classificationId" + String(classificationId) +
                  " languageId" + String(languageId) +
                  " pubYear" + String(pubYear) + 
                  " " + "currentSelectionPoint", 

                extraClasses: "mapPoint" +
                  " bookId" + String(bookId) + 
                  " classificationId" + String(classificationId) +
                  " languageId" + String(languageId) +
                  " pubYear" + String(pubYear) + 
                  " " + "currentSelectionPoint"
              }
            )
          } 
        ).on('click', mapPointClick)


      );
    };

    map.addLayer(markers);

    // add on click listener
    //markers.on('click', mapPointClick);

  }); /* closes page load book locations call */

  // pass map into global "globalMap" object and 
  // markers object into global variable
  globalMap = map;
  globalMarkers = markers;

}; /* closes initializeMap() function */

/*************************
* Add Additional Markers *
**************************/

// function to add points to an extant map
// currentSelectionPoint indicates this point was not part of 
// the initial page load but was added after the user selected a bar
var addMapPoints = function(json) {
  
  // remove all extant markers from the view
  globalMarkers.clearLayers();

  // retrieve book location json and add to the map
  for (i = 0; i < json.length; i++) {

    // manually add marker point to map for the current location
    var locationLat = json[i].lat;
    var locationLng = json[i].lng;
    var bookId = json[i].id;
    var classificationId = json[i].classificationId;
    var languageId = json[i].languageId;
    var pubYear = json[i].year;

    // add a special class to encode the fact that the current circle is 
    // a member of the currently selected dropdown val {classification, location}
    // and has the selection id that corresponds to the bar the user has clicked
    L.circleMarker([locationLat, locationLng], {
      color: "#c00000", 
      radius: 4,
      opacity: 0,
      fillOpacity: 0, 
      className: "mapPoint" +
        " bookId" + String(bookId) + 
        " classificationId" + String(classificationId) +
        " languageId" + String(languageId) +
        " pubYear" + String(pubYear) + 
        " " + "currentSelectionPoint"

    }).addTo(globalMap).on('click', mapPointClick);
  }; 

}; 

// function to reset map to initial page load conditions
$("#clear-map").click(function() {
  // restore opacity to all points
  d3.selectAll(".mapPoint").transition()
    .duration(1250)
    .style("stroke-opacity", "0.5")
    .style("fill-opacity", "0.2")
    .style("pointer-events", "auto");

  // restore opacity to all rects
  d3.selectAll("rect").transition()
    .duration(1250)
    .style("opacity", "1");

  // reset year slider
  yearRangeSlider.reset();

  // remove the currentSelectionPoint class from all points
  d3.selectAll(".currentSelectionPoint")
    .classed("currentSelectionPoint", false)
});
