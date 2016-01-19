// retrieve geojson with d3 and call the plotting function
function initialize() {
  d3.json("/json/europeanCountries.geojson", function(error, json) {
    if (error) return console.warn(error);
    visualizeMap(json);
  }); 
};


// read in geojson and plot that data
function visualizeMap(json) {

  console.log(json);

  // populate basemap
  var map = new L.Map("map", {
      center: new L.LatLng(46.85, 2.35),
      zoom: 5
  });

  // add map layer for black and white background
  map.addLayer(new L.tileLayer("http://korona.geog.uni-heidelberg.de/tiles/roadsg/x={x}&y={y}&z={z}", {
    maxZoom: 6,
    attribution: 'Imagery from <a href="http://giscience.uni-hd.de/">' +
        'GIScience Research Group @ University of Heidelberg</a> &mdash; ' +
        'Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }));

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
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.3
    };
  }



  // add the geoJson with data to the map
  L.geoJson(json, {style: style}).addTo(map);

  var onClick = function() {
    var a = $(this["options"]["className"])
    console.log(a[0].localName); 
  };

  // manually add marker point to map
  L.circleMarker([46.85, 2.35], {color: "#C00000", radius: 4, 
      className: "<google.com>"}).addTo(map).on('mouseover', onClick);;

 
};
 
