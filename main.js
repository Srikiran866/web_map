proj4.defs('EPSG:27700', '+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +datum=OSGB36 +units=m +no_defs');
ol.proj.proj4.register(proj4);

// Define the OSM source and layer
const osmSource = new ol.source.OSM();

// Create the OSM layer with EPSG:27700 projection
const osmLayer = new ol.layer.Tile({
  source: osmSource,
  extent: [-238375.0, 0.0, 700000.0, 1300000.0],
  projection: 'EPSG:27700'
});

// Create the map
const map = new ol.Map({
  target: 'map', // Replace 'map' with the ID of your map container element
  layers: [osmLayer],
  view: new ol.View({
    center: [0, 0], // Set the initial center coordinates as needed
    zoom: 10, // Set the initial zoom level as needed
    projection: 'EPSG:27700'
  })
});
//var mapView = new ol.View({
//  center: ol.proj.fromLonLat([-0.9,60]),
 // zoom: 8
//});

//var map = new ol.Map({
//  target: 'map',
//  view: mapView
//});

//var noneTile = new ol.layer.Tile({
//  title: 'None',
//  type: 'base',
//  visible: false
//});

//var osmTile = new ol.layer.Tile({
//  title: 'Open Street Map',
//  visible: true,
 // type: 'base',
//  source: new ol.source.OSM()
//});

//var baseGroup = new ol.layer.Group({
//  title: 'Base Maps',
//  fold: true,
//  layers: [osmTile, noneTile]
//});
//map.addLayer(baseGroup);

var hp_roadlinkTile = new ol.layer.Tile({
  title: "hp_roadlinks",
  source: new ol.source.TileWMS({
    url: 'http://localhost:8080/geoserver/Education/wms',
    params: { 'LAYERS': 'hp_roadlink', 'Tiled': true },
    serverType: 'geoserver',
    visible: false
  })
});

var hp_roadnodeTile = new ol.layer.Tile({
  title: "hp_roadnodes",
  source: new ol.source.TileWMS({
    url: 'http://localhost:8080/geoserver/Education/wms',
    params: { 'LAYERS': 'hp_roadnode', 'Tiled': true },
    serverType: 'geoserver',
    visible: false
  })
});
const geoserverWfsUrl='http://localhost:8080/geoserver/Education/ows';
const nodeLayerName='hp_roadnode,ht_roadnode,hu_roadnode';
const nodeLinkLayerName='hp_roadlink,ht_roadlink,hu_roadlink';

var OverLays = new ol.layer.Group({
  title: 'Overlay',
  layers: [hp_roadlinkTile, hp_roadnodeTile]
});
map.addLayer(OverLays);

var mousePosition = new ol.control.MousePosition({
  className: 'mousePosition',
  projection: 'EPSG:4326',
  coordinateFormat: function(coordinate) { return ol.coordinate.format(coordinate, '{y},{x}', 6); }
});
map.addControl(mousePosition);

var scaleControl = new ol.control.ScaleLine({
  bar: true,
  text: true
});
map.addControl(scaleControl);

var departureCoordinate = null;
var departgid=null;
var arrivalCoordinate = null;
var arrivalgid=null;
var departepsg=null;
var arrivalepsg=null;

var departureMarkerLayer = new ol.layer.Vector({
  source: new ol.source.Vector(),
  style: new ol.style.Style({
    image: new ol.style.Icon({
      src: 'https://openlayers.org/en/v6.5.0/examples/data/icon.png',
      color: 'red'
    })
  })
});
map.addLayer(departureMarkerLayer);

var arrivalMarkerLayer = new ol.layer.Vector({
  source: new ol.source.Vector(),
  style: new ol.style.Style({
    image: new ol.style.Icon({
      src: 'https://openlayers.org/en/v6.5.0/examples/data/icon.png',
      color: 'green'
    })
  })
});
map.addLayer(arrivalMarkerLayer);

// Handle click event on the map
map.on('click', function(event) {
  var coordinate = event.coordinate;

  if (!departureCoordinate) {
    // Set departure point
    departureCoordinate = coordinate;

    addMarker(departureMarkerLayer, departureCoordinate, 'red');
    console.log(departureCoordinate);
    console.log("Departure Coordinate:", ol.proj.toLonLat(departureCoordinate));

    fetchDataFromSQLViewWithParams(departureCoordinate, function(response) {
      var newCoordinate = extractNewCoordinate(response);
      departgid=extractNewCoordinate(response)[2];

      console.log(newCoordinate); 
      console.log(departgid);

      // Update departureCoordinate with newCoordinate
      departureCoordinate = newCoordinate;

      // Remove the existing departure marker
      departureMarkerLayer.getSource().clear();

      // Add a new departure marker at the updated departureCoordinate
      addMarker(departureMarkerLayer, departureCoordinate, 'red');
      departepsg=epsg3857toEpsg4326(departureCoordinate);
      console.log(departepsg[0]);
      console.log("a:");
      console.log("New Departure Coordinate:", ol.proj.toLonLat(departureCoordinate));

      //addMarker(arrivalMarkerLayer, newCoordinate, 'green');
      //console.log("New Coordinate:", ol.proj.toLonLat(newCoordinate));
    });
  } else if (!arrivalCoordinate) {
    // Set arrival point
    arrivalCoordinate = coordinate;
    addMarker(arrivalMarkerLayer, arrivalCoordinate, 'green');
    console.log("Arrival Coordinate:", ol.proj.toLonLat(arrivalCoordinate));
    fetchDataFromSQLViewWithParams(arrivalCoordinate, function(response) {
      var newCoordinate = extractNewCoordinate(response);
      arrivalgid=extractNewCoordinate(response)[2];
      console.log(newCoordinate);
      console.log(arrivalgid);

      // Update departureCoordinate with newCoordinate
      arrivalCoordinate = newCoordinate;

      // Remove the existing departure marker
      arrivalMarkerLayer.getSource().clear();

      // Add a new departure marker at the updated departureCoordinate
      addMarker(arrivalMarkerLayer, arrivalCoordinate, 'green');
      arrivalepsg=epsg3857toEpsg4326(arrivalCoordinate);
      console.log(departepsg);
      console.log("b:");
      console.log(arrivalepsg);
      console.log("c:");
      const sourceLat = departepsg[1]; // Replace with your source latitude
    const sourceLon = departepsg[0]; // Replace with your source longitude
    
    const destLat = arrivalepsg[1];   // Replace with your destination latitude
    const destLon = arrivalepsg[0];
    
    // OSM Nominatim API for geocoding
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${sourceLat}&lon=${sourceLon}`;
    
    // OSRM API for routing
    const osrmUrl = `http://router.project-osrm.org/route/v1/driving/${sourceLon},${sourceLat};${destLon},${destLat}?overview=false`;
    
    // Function to get the distance and travel time
    async function getDistanceAndTravelTime() {
      try {
        const nominatimResponse = await fetch(nominatimUrl);
        const nominatimData = await nominatimResponse.json();
        const sourceAddress = nominatimData.display_name;
    
        const osrmResponse = await fetch(osrmUrl);
        const osrmData = await osrmResponse.json();
        const distance = osrmData.routes[0].distance; // Distance in meters
        const duration = osrmData.routes[0].duration; // Duration in seconds
    
        console.log(`Source Address: ${sourceAddress}`);
        console.log(`Distance: ${distance} meters`);
        console.log(`Travel Time: ${duration} seconds`);
      } catch (error) {
        console.error('Error:', error.message);
      }
    }
    
    getDistanceAndTravelTime();

      console.log("New Departure Coordinate:", ol.proj.toLonLat(arrivalCoordinate));
      // Replace with your desired view parameters
      var viewParams = {
        source: departgid,
        target: arrivalgid
      };
    

const url = 'http://localhost:8080/geoserver/Education/ows?' +
  'service=WFS&' +
  'version=1.0.0&' +
  'request=GetFeature&' +
  'typeName=Education%3Ashortest_path&'+
  'maxFeatures=50&' +
  'outputFormat=application/json&' +
  'viewParams=source%3A' + departgid+'%3Btarget%3A'+arrivalgid;
console.log(url);
const source = new ol.source.Vector({
  format: new ol.format.GeoJSON(),
  url: url
});

const layer = new ol.layer.Vector({
  source: source,
  style: new ol.style.Style({
    fill: new ol.style.Fill({
      color: 'rgba(255, 0, 0, 0.6)' // Change this color value
    }),
    stroke: new ol.style.Stroke({
      color: 'rgba(255, 0, 0, 1)', // Change this color value
      width: 2
    })
  })
});
map.addLayer(layer);

      //addMarker(arrivalMarkerLayer, newCoordinate, 'green');
      //console.log("New Coordinate:", ol.proj.toLonLat(newCoordinate));
    });
    
  }
});

function addMarker(markerLayer, coordinate, color) {
  markerLayer.getSource().clear();
  var marker = new ol.Feature({
    geometry: new ol.geom.Point(coordinate)
  });
  marker.setStyle(new ol.style.Style({
    image: new ol.style.Icon({
      src: 'https://openlayers.org/en/v6.5.0/examples/data/icon.png',
      color: color
    })
  }));
  markerLayer.getSource().addFeature(marker);
  
  //var lonLat = ol.proj.transformExtent(coordinate, 'EPSG:3857', 'EPSG:27700');
  //console.log("Marker Coordinate (EPSG:4326):", lonLat[1].toFixed(6), lonLat[0].toFixed(6));
}


function fetchDataFromSQLViewWithParams(coordinate, onSuccess) {
  var viewParams = {
    x: coordinate[0],
    y: coordinate[1]
  };

  var url = 'http://localhost:8080/geoserver/Education/wms';
  var params = {
    service: 'WFS',
    version: '1.1.0',
    request: 'GetFeature',
    typeName: 'Nearest_vertex',
    outputFormat: 'application/json',
    viewparams: Object.keys(viewParams).map(function(key) {
      return key + ':' + viewParams[key];
    }).join(';')
  };

  var encodedParams = Object.keys(params).map(function(key) {
    return key + '=' + encodeURIComponent(params[key]);
  }).join('&');

  var fullUrl = url + '?' + encodedParams;
  console.log(fullUrl);

  var xhr = new XMLHttpRequest();
  xhr.open('GET', fullUrl, true);
  xhr.responseType = 'json';

  xhr.onload = function() {
    if (xhr.status === 200) {
      onSuccess(xhr.response);
    } else {
      console.error('Request failed:', xhr.status, xhr.statusText);
    }
  };

  xhr.onerror = function() {
    console.error('Request failed:', xhr.status, xhr.statusText);
  };

  xhr.send();
}


function extractNewCoordinate(response) {
  var coord= response.features[0].geometry.coordinates;
  var gid=response.features[0].properties.gid;
  console.log(coord);
  return [coord[0], coord[1],gid];
}

function epsg3857toEpsg4326(pos) {
  let x = pos[0];
  let y = pos[1];
  x = (x * 180) / 20037508.34;
  y = (y * 180) / 20037508.34;
  y = (Math.atan(Math.pow(Math.E, y * (Math.PI / 180))) * 360) / Math.PI - 90;
  return [x, y];
}
function epsg4326toEpsg3857(coordinates) {
  let x = pos[0];
  let y = pos[1];
  x = (coordinates[0] * 20037508.34) / 180;
  y =
    Math.log(Math.tan(((90 + coordinates[1]) * Math.PI) / 360)) /
    (Math.PI / 180);
  y = (y * 20037508.34) / 180;
  return [x, y];
}
// Your latitude and longitude values for source and destination points
