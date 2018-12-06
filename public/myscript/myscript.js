L.mapbox.accessToken = 'pk.eyJ1IjoiZGFua28wOSIsImEiOiJjam05MWdwMm0wb3JkM3BsaWlzNGdxank1In0.WFp0wqZrTby3gJpyyi9ROw';
            var map = L.mapbox.map('map-one', 'mapbox.streets', {
              scrollWheelZoom: true
            }).setView([49.118235, 20.063350], 14.8);


            var LAT;
            var LNG;
            var Marker;
            var HikingEndMarker;
            var markers = [];
            var lines = [];
            var circles = [];
            var arounLayer = L.mapbox.featureLayer().addTo(map);
            var hikingPath = L.mapbox.featureLayer().addTo(map);
            var pointOfInterestsLayer = L.mapbox.featureLayer().addTo(map);

            map.on('click', addPoint);
            
            function addPoint(e) {
                if(Marker != null){
                    Marker.remove();
                }
                if(HikingEndMarker != null){
                    HikingEndMarker.remove();   
                }
                map.removeLayer(hikingPath);
                removeObjects(circles);
                map.removeLayer(pointOfInterestsLayer); 
                map.removeLayer(arounLayer);
                LAT = e.latlng.lat;
                LNG = e.latlng.lng;
                Marker = L.marker([e.latlng.lat,e.latlng.lng], {icon: L.mapbox.marker.icon({ "marker-size": "medium", "marker-color": "#000080"})})
                        .addTo(map);      
            }
            
            function HikingMarkerClick(e) {
                var HikingMarkLat = e.latlng.lat;
                var HikingMarkLng = e.latlng.lng;
                var rangeEndHiking = document.getElementById("rangeEndHiking").value;
                map.removeLayer(hikingPath);
                removeObjects(circles);
                lines.forEach(element => {
                    var lngE1 = parseFloat(element.geometry.coordinates[0][0]);
                    var latE1 = parseFloat(element.geometry.coordinates[0][1]);
                    var lngE2 = parseFloat(element.geometry.coordinates[element.geometry.coordinates.length-1][0]);
                    var latE2 = parseFloat(element.geometry.coordinates[element.geometry.coordinates.length-1][1]);    
                    if(HikingMarkLat == latE1 && HikingMarkLng == lngE1){
                        if(HikingEndMarker != null){
                            HikingEndMarker.remove();
                        }
                        HikingEndMarker = L.marker([latE2,lngE2], {icon: L.mapbox.marker.icon({ "marker-size": "small", "marker-color": "#000080"})})
                                            .bindPopup("Dĺžka trasy: " + element.linelength + " m").openPopup()
                                            .addTo(map);
                        
                        addCircle(rangeEndHiking,latE2,lngE2);
                        element.properties.stroke="#DC143C";
                        hikingPath = L.mapbox.featureLayer().setGeoJSON(element).addTo(map); 
                        getPointsOfInterest("/interestsaroundhikingpath/" + latE2 + "/" + lngE2 + "/" + rangeEndHiking); 
                        return;
                    } else if (HikingMarkLat == latE2 && HikingMarkLng == lngE2) {
                        if(HikingEndMarker != null){
                            HikingEndMarker.remove();
                        }
                        HikingEndMarker = L.marker([latE1,lngE1], {icon: L.mapbox.marker.icon({ "marker-size": "small", "marker-color": "#000080"})})
                                            .bindPopup("Dĺžka trasy: " + element.linelength + " m").openPopup()
                                            .addTo(map);
                        addCircle(rangeEndHiking,latE1,lngE1);
                        element.properties.stroke="#DC143C";
                        hikingPath = L.mapbox.featureLayer().setGeoJSON(element).addTo(map);
                        getPointsOfInterest("/interestsaroundhikingpath/" + latE1 + "/" + lngE1 + "/" + rangeEndHiking); 
                        return;
                    }                
                });
            }

            function getHikingPathsRails(url){
                var inputRange = document.getElementById("range").value;
                var xhttp = new XMLHttpRequest();
                map.removeLayer(pointOfInterestsLayer);
                map.removeLayer(hikingPath);
                map.removeLayer(arounLayer);
                removeObjects(markers);
                removeObjects(circles);
                xhttp.onreadystatechange = function() {
                  if (xhttp.readyState == 4 && xhttp.status == 200) {
                    var jsonData = JSON.parse(xhttp.responseText);                    
                    console.dir(jsonData); 
                    lines = jsonData;
                    jsonData.forEach(element => {
                        var lngE1 = parseFloat(element.geometry.coordinates[0][0]);
                        var latE1 = parseFloat(element.geometry.coordinates[0][1]);
                        var lngE2 = parseFloat(element.geometry.coordinates[element.geometry.coordinates.length-1][0]);
                        var latE2 = parseFloat(element.geometry.coordinates[element.geometry.coordinates.length-1][1]);
                        var LATstation = parseFloat(element.geometrystation.coordinates[0]);
                        var LNGstation = parseFloat(element.geometrystation.coordinates[1]);
                        addCircle(inputRange,LNGstation,LATstation);
                        if(getDistanceFromLatLonInKm(latE1, lngE1, LNGstation, LATstation) < getDistanceFromLatLonInKm(latE2, lngE2, LNGstation, LATstation)){
                            if(element.properties.lanovka == false){
                            var highwayPoint = L.marker([latE1,lngE1], {icon: L.mapbox.marker.icon({ "marker-symbol": "circle", "marker-size": "medium", "marker-color": "#32CD32"})})
                                                .on('click', HikingMarkerClick)
                                                .addTo(map);
                            } else if(element.properties.lanovka == true){ var highwayPoint = L.marker([latE1,lngE1], {icon: L.mapbox.marker.icon({ "marker-symbol": "aerialway", "marker-size": "medium", "marker-color": "#8A2BE2"})})
                                                .on('click', HikingMarkerClick)
                                                .addTo(map);
                            }
                            markers.push(highwayPoint);
                        }
                        else {
                            if(element.properties.lanovka == false){
                            var highwayPoint = L.marker([latE2,lngE2], {icon: L.mapbox.marker.icon({ "marker-symbol": "circle", "marker-size": "medium", "marker-color": "#32CD32"})})
                                                .on('click', HikingMarkerClick)
                                                .addTo(map);
                            } else if(element.properties.lanovka == true) {var highwayPoint = L.marker([latE2,lngE2], {icon: L.mapbox.marker.icon({ "marker-symbol": "aerialway", "marker-size": "medium", "marker-color": "#8A2BE2"})})
                                                .on('click', HikingMarkerClick)
                                                .addTo(map);
                            }
                            markers.push(highwayPoint);
                        }                   
                    });
                    map.removeLayer(hikingPath);
                    hikingPath = L.mapbox.featureLayer().setGeoJSON(jsonData).addTo(map);
                  }
                };
                var fromLength = document.getElementById("fromLength").value;
                var toLength = document.getElementById("toLength").value;
                xhttp.open("GET", url + inputRange+"/"+fromLength+"/"+toLength, true);
                xhttp.send();
            }
            
            function getHikingPaths(url){          
                var inputRange = document.getElementById("range").value;
                var xhttp = new XMLHttpRequest();
                removeObjects(circles);
                addCircle(inputRange, LAT, LNG);
                map.removeLayer(pointOfInterestsLayer);
                map.removeLayer(arounLayer);
                xhttp.onreadystatechange = function() {
                  if (xhttp.readyState == 4 && xhttp.status == 200) {
                    var jsonData = JSON.parse(xhttp.responseText);                    
                    console.dir(jsonData);
                    lines = jsonData;
                    removeObjects(markers);
                    jsonData.forEach(element => {
                        var lngE1 = parseFloat(element.geometry.coordinates[0][0]);
                        var latE1 = parseFloat(element.geometry.coordinates[0][1]);
                        var lngE2 = parseFloat(element.geometry.coordinates[element.geometry.coordinates.length-1][0]);
                        var latE2 = parseFloat(element.geometry.coordinates[element.geometry.coordinates.length-1][1]);
                        if(getDistanceFromLatLonInKm(latE1, lngE1, LAT, LNG) < getDistanceFromLatLonInKm(latE2, lngE2, LAT, LNG)){
                            if(element.properties.lanovka == false){
                            var highwayPoint = L.marker([latE1,lngE1], {icon: L.mapbox.marker.icon({ "marker-symbol": "circle", "marker-size": "medium", "marker-color": "#32CD32"})})
                                                .on('click', HikingMarkerClick)
                                                .addTo(map);
                            } else if(element.properties.lanovka == true){ var highwayPoint = L.marker([latE1,lngE1], {icon: L.mapbox.marker.icon({ "marker-symbol": "aerialway", "marker-size": "medium", "marker-color": "#8A2BE2"})})
                                                .on('click', HikingMarkerClick)
                                                .addTo(map);
                            }
                            markers.push(highwayPoint);
                        }
                        else {
                            if(element.properties.lanovka == false){
                            var highwayPoint = L.marker([latE2,lngE2], {icon: L.mapbox.marker.icon({ "marker-symbol": "circle", "marker-size": "medium", "marker-color": "#32CD32"})})
                                                .on('click', HikingMarkerClick)
                                                .addTo(map);
                            } else if(element.properties.lanovka == true) {var highwayPoint = L.marker([latE2,lngE2], {icon: L.mapbox.marker.icon({ "marker-symbol": "aerialway", "marker-size": "medium", "marker-color": "#8A2BE2"})})
                                                .on('click', HikingMarkerClick)
                                                .addTo(map);
                            }
                            markers.push(highwayPoint);
                        }                   
                    });  
                    map.removeLayer(hikingPath);
                    hikingPath = L.mapbox.featureLayer().setGeoJSON(jsonData).addTo(map);
                  }
                };
                var fromLength = document.getElementById("fromLength").value;
                var toLength = document.getElementById("toLength").value;
                xhttp.open("GET", url+LAT+"/"+LNG+"/"+inputRange+"/"+fromLength+"/"+toLength, true);
                xhttp.send();
            }

            function getPointsOfInterest(url){
                var xhttp = new XMLHttpRequest();
                var geJsonArray = [];
                map.removeLayer(pointOfInterestsLayer);
                removeObjects(markers);
                var rangeEndHiking = document.getElementById("rangeEndHiking").value;
                xhttp.onreadystatechange = function() {
                  if (xhttp.readyState == 4 && xhttp.status == 200) {
                    var jsonData = JSON.parse(xhttp.responseText);                    
                    console.dir(jsonData);
                    map.removeLayer(pointOfInterestsLayer); 
                    pointOfInterestsLayer = L.mapbox.featureLayer().setGeoJSON(jsonData).addTo(map);
                  }
                };
                xhttp.open("GET", url, true);
                xhttp.send();
            }

            function getAroundYou(url){
                var rangeAroundYou = document.getElementById("rangeAroundYou").value;
                removeObjects(circles);
                addCircle(rangeAroundYou, LAT, LNG);
                var xhttp = new XMLHttpRequest();
                var geJsonArray = [];
                map.removeLayer(hikingPath);
                map.removeLayer(arounLayer);
                map.removeLayer(pointOfInterestsLayer);
                removeObjects(markers);
                var rangeAroundYou = document.getElementById("rangeAroundYou").value;
                xhttp.onreadystatechange = function() {
                  if (xhttp.readyState == 4 && xhttp.status == 200) {
                    var jsonData = JSON.parse(xhttp.responseText);                    
                    console.dir(jsonData);
                    arounLayer = L.mapbox.featureLayer().setGeoJSON(jsonData).addTo(map);
                  }
                };
                xhttp.open("GET", url + LAT + "/" + LNG + "/" + rangeAroundYou, true);
                xhttp.send();
            }

            function addCircle(e, f, g){
                var circle = L.circle([f, g], {
                    color: 'blue',
                    fillColor: '#f03',
                    fillOpacity: 0.05,
                    radius: e
                }).addTo(map);
                circles.push(circle);
            }
        
function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2-lat1);  // deg2rad below
    var dLon = deg2rad(lon2-lon1); 
    var a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
      ; 
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    var d = (R * c)*1000; // Distance in km
    return d;
  }

  function deg2rad(deg) {
    return deg * (Math.PI/180)
  }

  function removeObjects(e){
    e.forEach(element => {
        if(element != null){
            element.remove();
        }
    });
}