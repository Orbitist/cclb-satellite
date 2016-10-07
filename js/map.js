// Run a check to see if there was a hash on load
var hasHash = false;
if(window.location.hash) {
  hasHash = true;
}
else {
  hasHash = false;
}

// Set Url for points info API
var pointsInfoApi = 'http://www.chautauqualandbank.org/api';

// Do things if in edit mode
if (mode == 'edit'){
  var pointsInfoApi = 'http://www.chautauqualandbank.org/api';
}



// Get points geojson data //
var orbitistPointsGeojson = (function () {
    var orbitistPointsGeojson = null;
    $.ajax({
        'async': false,
        'global': false,
        'url': pointsInfoApi,
        'dataType': "json",
        'success': function (data) {
            orbitistPointsGeojson = data;
        }
    });
    return orbitistPointsGeojson;
})();

// Find and replace all the nasty characters
var jsonCleaner = JSON.stringify(orbitistPointsGeojson).replace(/&amp;/g, '&').replace(/&#039;/g, '\'');
var orbitistPointsGeojsonCleaned = JSON.parse(jsonCleaner);



// Check to see if there are more than 1 item in the json. If not, set these bounds
if ( orbitistPointsGeojsonCleaned.features.length < 2 ) {
  var bounds = [[-180,90], [192,61]];
}
else {
  // Get bounds from orbitistPointsGeojson //
  var bounds = new mapboxgl.LngLatBounds();
  orbitistPointsGeojsonCleaned.features.forEach(function(feature) {
      bounds.extend(feature.geometry.coordinates);
  });
}

// Check to see if in embed mode. If so set scrollZoomSetting to false
var scrollZoomSetting = true;
if (mode == 'embed') {
  scrollZoomSetting = false;
}
else {
  scrollZoomSetting = true;
}

var map = new mapboxgl.Map({
    container: 'map',
    pitch: 0,
    hash: false,
    scrollZoom: scrollZoomSetting
});

var textFieldCode = "{point_title}";
if (numberedPoints == "true") {
  textFieldCode = "{point_position_number} - {point_title}";
}

  map.on('load', function() {
    map.addSource("orbitistPoints", {
      type: "geojson",
      data: orbitistPointsGeojsonCleaned
    });
    map.addLayer({
      "id": "points",
      "type": "circle",
      "source": "orbitistPoints",
      'paint': {
        // make circles larger as the user zooms from z12 to z22
        'circle-radius': {
          'base': 1.75,
          'stops': [[12, 8], [22, 180]]
        },
        // color circles by ethnicity, using data-driven styles
        'circle-color': {
          property: 'category',
          type: 'categorical',
          stops: [
            ['Recently Sold Rehab Properties', '#fbb03b'],
            ['Rehabs for Sale', '#223b53'],
            ['Recently Demolished', '#e55e5e'],
            ['Future Demolitions', '#3bb2d0']]
        }
      }
    });


    // Check to see if there was a has on load
    if(hasHash == true) {
    } else {
      map.fitBounds(bounds, { padding: '50' });
    }


  });

map.on('click', function (e) {
  var features = map.queryRenderedFeatures(e.point, { layers: ['points'] });
  if (!features.length) {
      return;
  }
  var feature = features[0];

  // get propertyCategoryImage
  var propertyCategoryImage = null;
  if (feature.properties.category == 'Recently Sold Rehab Properties'){
    propertyCategoryImage = '<img src="img/sold-rehab.png" class="propertyCategoryImage" /> Recently Sold Rehab';
  }
  if (feature.properties.category == 'Rehabs for Sale'){
    propertyCategoryImage = '<img src="img/for-sale.png" class="propertyCategoryImage" /> For Sale';
  }
  if (feature.properties.category == 'Recently Demolished'){
    propertyCategoryImage = '<img src="img/recently-demolished.png" class="propertyCategoryImage" /> Recently Demolished';
  }
  if (feature.properties.category == 'Future Demolitions'){
    propertyCategoryImage = '<img src="img/future-demolitions.png" class="propertyCategoryImage" /> Future Demolition';
  }

  // Build Image
  var propertyImage = '';
  if (feature.properties.image != 'null'){
    propertyImage = '<img src="' + feature.properties.image + '" class="popup-top-image">';
  }

  var propertyFeaturesList = '<p><strong>Current Owner:</strong> ' + feature.properties.property.LotSize + '<br>' +
  '<strong>Total Assessed Value:</strong> $' + feature.properties.category + '<br>' +
  '<strong>Feature:</strong> ' + feature.properties.category + '<br>' +
  '<strong>Feature:</strong> ' + feature.properties.category + '<br>' +
  '<strong>Feature:</strong> ' + feature.properties.category + '<br>' +
  '<strong>Feature:</strong> ' + feature.properties.category + '<br>' +
  '<strong>Feature:</strong> ' + feature.properties.category + '</p>';

  var popup = new mapboxgl.Popup({anchor: 'none'})
    .setLngLat(feature.geometry.coordinates)
    .setHTML(propertyImage + '<div class="popup-body"><div class="popuptitle"><h3>' + feature.properties.name + '</h3></div>' +
      '<p><strong>' + propertyCategoryImage + '</strong></p>' +
      propertyFeaturesList +
      '<a href="http://www.chautauqualandbank.org/properties/' + feature.properties.permalink + '" target="_blank"><p class="orbitist-link">View Full Listing </p></a>' +
      '<div class="action-items"><div class="action-item"><a href="https://www.google.com/maps/dir/Current+Location/' + feature.geometry.coordinates[1] + ',' + feature.geometry.coordinates[0] + '" target="_blank"><span class="fa fa-car center-block"></span></a></div><div class="action-item"><a href="https://app.orbitist.com/print/' + feature.properties.point_id + '" target="_blank"><span class="fa fa-print center-block"></span></a></div></div></div>')
    .addTo(map);
  if (features.length) {
    // Get coordinates from the symbol and center the map on those coordinates
    map.flyTo({center: features[0].geometry.coordinates});
  }
  // Do things if in edit mode
  if (mode == 'edit'){
    $('div.popuptitle h3').append(' <a target="_parent" href="/node/' + feature.properties.point_id + '/edit?destination=edit-map/' + mapid + '"><span class="edit-button"><i class="fa fa-pencil"></i> Edit</span></a>');
  }
});

// Use the same approach as above to indicate that the symbols are clickable
// by changing the cursor style to 'pointer'.
map.on('mousemove', function (e) {
  var features = map.queryRenderedFeatures(e.point, { layers: ['points'] });
  map.getCanvas().style.cursor = (features.length) ? 'pointer' : '';
});

// Map Controls
map.addControl(new mapboxgl.Navigation({position: 'top-right'}));

// If in embed mode, add fullscreen button
if (mode == 'embed'){
  $('body').append('<a target="_blank" href="https://app.orbitist.com/map/' + mapid + '"><div class="map-fullscreen-toggle control"><i class="fa fa-arrows-alt"></i></div></a>');
}

// Geolocate map
var allowFlyTo = false;
var geolocationMarker = null;
var globalCoords = null;

//Reset map view
jQuery('.map-reset').click(function () {
  allowFlyTo = false;
  map.fitBounds(bounds, { padding: '50', pitch: '0' });
});

function centerMap (position){
  jQuery('.map-geolocate').removeClass("pulsate");
  if (allowFlyTo == true) {
    map.flyTo({center:[position.coords.longitude, position.coords.latitude],zoom:18,bearing:0,pitch:0});
  }
  if (geolocationMarker != null) {
    geolocationMarker.remove();
  }
  // create an img element for the marker
  geolocationMarker = document.createElement('img');
  geolocationMarker.src = "https://app.orbitist.com/launch/cdn/orbitist-icons/orbitist_smile.gif";
  geolocationMarker.style.width = "40px";
  geolocationMarker.style.height = "40px";
  new mapboxgl.Marker(geolocationMarker).setLngLat([position.coords.longitude, position.coords.latitude]).addTo(map);

  globalCoords = position;
};

function locateError () {
  jQuery('.map-geolocate').removeClass("pulsate");
  alert("There was a problem finding your location. Please try again.");
};

jQuery('.map-geolocate').click(function () {
  allowFlyTo = true;
  jQuery('.map-geolocate').addClass("pulsate");
  if (globalCoords != null) {
    map.flyTo({center:[globalCoords.coords.longitude, globalCoords.coords.latitude],zoom:18,bearing:0,pitch:0});
    jQuery('.map-geolocate').removeClass("pulsate");
  }
  navigator.geolocation.watchPosition(centerMap, locateError, {enableHighAccuracy: true, maximumAge:5000});
});

// Turn off geolocation recenter
jQuery('body').mousedown(function () {
  allowFlyTo = false;
});
jQuery('body').on({ 'touchstart': function () {
  allowFlyTo = false;
}});


renderMapList();
removeSpinner();
