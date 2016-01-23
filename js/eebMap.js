// create the base map to which other layers will be added
var globalMap = '';

var initializeMap = function() {

 // add basemap to the #map id div
  var map = new L.Map("map", {
      center: new L.LatLng(46.85, 4.35),
      zoom: 5
  });

  // add map layer for black and white background
  map.addLayer(new L.tileLayer("http://korona.geog.uni-heidelberg.de/tiles/roadsg/x={x}&y={y}&z={z}", {
    maxZoom: 7,
    attribution: 'Imagery from <a href="http://giscience.uni-hd.de/">' +
        'GIScience Research Group @ University of Heidelberg</a> &mdash; ' +
        'Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }));

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

      // add book id and classification id to the circle's class values
      L.circleMarker([locationLat, locationLng], {color: "#c00000", radius: 4, 
          className: "mapPoint" +
            " bookId" + String(bookId) + 
            " classificationId" + String(classificationId) +
            " languageId" + String(languageId) 
      }).addTo(map).on('click', mapPointClick);;
    };
  });

  // pass map into global "globalMap" object
  globalMap = map;
};

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

    // add a special class to encode the fact that the current circle is 
    // a member of the currently selected dropdown val {classification, location}
    // and has the selection id that corresponds to the bar the user has clicked
    L.circleMarker([locationLat, locationLng], {color: "#c00000", radius: 4, 
        className: "mapPoint" +
          " bookId" + String(bookId) + 
          " classificationId" + String(classificationId) +
          " languageId" + String(languageId) +
          " " + "currentSelectionPoint"
    }).addTo(globalMap).on('click', mapPointClick);;
  }; 
}; 
