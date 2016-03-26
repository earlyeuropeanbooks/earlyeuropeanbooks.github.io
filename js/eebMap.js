// create the base map to which other layers will be added
var globalMap = '';

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
    maxZoom: 15,
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
    tms: true,
    // set bounds to prevent 404's from appearing when
    // the client requests image tiles that don't exist
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
  * Add initial Markers *
  ***********************/

  // define marker look
  var greenIcon = L.icon({
    iconUrl: '/images/green-book.png',
    //shadowUrl: '/images/leaf-shadow.png',

    iconSize:     [30, 30], // size of the icon
    //shadowSize:   [50, 64], // size of the shadow
    iconAnchor:   [15, 15], // point of the icon which will correspond to marker's location
    //shadowAnchor: [4, 62],  // the same for the shadow
    //popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
  });

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
          [locationLat, locationLng], {
            icon: L.icon({
              // specify the path to the png file to be used
              // to represent the point on the map
              iconUrl: '/images/green-book.png',
              
              // specify the path to a shadow image
              //shadowUrl: '/images/green-book-shadow.png',

              // set the size of the icon
              iconSize:     [30, 30],

              // set the size of the shadow
              //shadowSize:   [50, 64],

              // identify the point of the icon that will correspond to the marker's location on the map
              iconAnchor:   [15, 15], 

              // identify the point of the shadow that will correspond to the shadown's location on the map
              //shadowAnchor: [4, 62],

              // identify the point from which the popup should open relative to the iconAnchor
              //popupAnchor:  [-3, -76]

              // identify the class properties for the icon
              className: "mapPoint" +
                " bookId" + String(bookId) + 
                " classificationId" + String(classificationId) +
                " languageId" + String(languageId) +
                " pubYear" + String(pubYear)
            })
          }
        )
      );
    };

    map.addLayer(markers)

    // having initialized the map points with 0 opacity, transition
    // them into the map
    var allMapPoints = d3.selectAll(".mapPoint")
    allMapPoints.transition()
      .duration(1250)
      .style("stroke-opacity", "0.5")
      .style("fill-opacity", "0.2");
  
  }); /* closes page load book locations call */

  // pass map into global "globalMap" object
  globalMap = map;

}; /* closes initializeMap() function */

/*************************
* Add Additional Markers *
**************************/

// function to add points to an extant map
// currentSelectionPoint indicates this point was not part of 
// the initial page load but was added after the user selected a bar
var addMapPoints = function(json) {
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
    }).addTo(globalMap).on('click', mapPointClick);;
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
