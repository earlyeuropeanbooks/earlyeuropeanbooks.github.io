// create the base map to which other layers will be added,
// the markers layer on which we'll add all relevant points,
// and a global data store of the page load json
var globalMap = '';
var globalMarkers = '';
var globalLastJson = '';
var globalPageLoadJson = '';

// create function to initialize the map and prepare it for
// the addition of markers
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

  /*****************
  * Opacity Slider *
  *****************/

  // add an opacity slider to the imageTileLayer
  var opacitySlider = new L.Control.opacitySlider();
    map.addControl(opacitySlider);
    opacitySlider.setOpacityLayer(imageTileLayer);

  /*********************
  * Initialize markers *
  *********************/

  // retrieve the page load json and push it into the global variable
  d3.json("/json/page_load_book_locations.json", function(error, bookLocationJson) {
    if (error) return console.warn(error);
    globalPageLoadJson = bookLocationJson;

    // pass map into global "globalMap" object and 
    // markers object into global variable
    globalMap = map;

    // call the function to add the initial page load json to the map
    addMapPoints(globalPageLoadJson, 1473, 1700);

  }); /* closes the d3.json fetch and establishment of global */

}; /* closes initializeMap() function */

/**************
* Add Markers *
**************/

// function to add points to an extant map
// add startYaer and endYear parameters so that if the user
// has set the year range slider, we can filter out icons appropriately
var addMapPoints = function(bookLocationJson, firstYear, lastYear) {
  
  // update the globalLastJson object so we recall the last
  // json file we loaded (we do this so we can pass the same
  // json back through the addMapPoints function when users change
  // the date range slider)
  globalLastJson = bookLocationJson;

  // add functionality to display a progress bar while the json loads
  var progress = document.getElementById('progress');
  var progressBar = document.getElementById('progress-bar');
  function updateProgressBar(processed, total, elapsed, layersArray) {
    if (elapsed > 750) {
      // if it takes more than a second to load, display the progress bar:
      progress.style.display = 'block';
      progressBar.style.width = Math.round(processed/total*100) + '%';
    }
    if (processed === total) {
      // all markers processed - hide the progress bar:
      progress.style.display = 'none';
    }
  }

  /*********************
  * Add marker cluster *
  **********************/

  var markers = L.markerClusterGroup({ 
    chunkedLoading: true, 
    chunkProgress: updateProgressBar, 
    chunkInterval: 300,
    chunkDelay: 10 
  });

  // retrieve book location json and add to the map
  for (i = 0; i < bookLocationJson.length; i++) {

    // manually add marker point to map for the current location
    var locationLat = bookLocationJson[i][0];
    var locationLng = bookLocationJson[i][1];
    var bookId = bookLocationJson[i][2];
    var pubYear = bookLocationJson[i][3];

    // check if the pubYear of this record falls outside the year range of 
    // the slider; if so, skip this record
    if (pubYear > lastYear) {
      continue;
    }
    else if (pubYear < firstYear) {
      continue;
    }

    // add book id and classification id to the icon's class values
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
              // to preserve the class structure necessary for the 
              // icon to possess the intended color, then add the bookId
              // and publication Year
              className: "awesome-marker" +
                " bookId" + String(bookId) + 
                " pubYear" + String(pubYear) 

              // nb: L.AwesomeMarkers.icon() also accepts 
              // an argument "extraClasses" just like className,
              // though the extraClasses are only added to the 
              // font awesome icon

            }
          )
        } 
      ).on('click', mapPointClick) /* closes the L.marker call */

    );
  };

  // if there are either group markers or individual markers on the map,
  // remove them. If there are no group markers or individual markers,
  // catch the TypeError that springs but don't do anything with that error
  try {$(".leaflet-marker-icon").remove();} catch(TypeError) {};
  try {$(".awesome-marker").remove();} catch(TypeError) {};

  // add the new markers to the map
  globalMap.addLayer(markers);

  // push the new markers layer into the global state
  globalMarkers = markers;
}; 


// function to reset map to initial page load conditions
// on click of the "Reset Map" button
$("#clear-map").click(function() {
  
  // restore the initial page load json
  addMapPoints(globalPageLoadJson, 1473, 1700);

  // restore opacity to all rects
  d3.selectAll("rect").transition()
    .duration(1250)
    .style("opacity", "1");

  // reset year slider
  yearRangeSlider.reset();
});

