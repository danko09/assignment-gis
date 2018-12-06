var express = require('express');
var router = express.Router();
var pg = require('pg');
var connString = 'pg://postgres:GranFan9438dl@localhost:5432/tatry_db';

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/hikingpaths/:LAT/:LNG/:inputRange/:from/:to', function(req, res, next) {

  var client = new pg.Client(connString);
  
  client.connect();
  //SELECT aerialway,line1.name, ST_AsGeoJSON(ST_Transform(line1.way,4326)) AS geometry, ST_Distance(ST_Transform(line1.way,4326)::geography, ST_MakePoint(" + req.params.LNG +"," + req.params.LAT +")) AS distance, ST_Length(ST_Transform(line1.way,4326)::geography) AS linelength FROM planet_osm_line AS line1 INNER JOIN (SELECT way FROM planet_osm_line AS pp WHERE ST_Length(ST_Transform(way,4326)::geography) > 50 AND ST_Length(ST_Transform(way,4326)::geography) < 100) AS myway ON (myway.way=line1.way) INNER JOIN (SELECT way FROM planet_osm_line AS pp2 WHERE ST_Dwithin(ST_MakePoint(" + req.params.LNG +"," + req.params.LAT +"), ST_Transform(way,4326)::geography, " + req.params.inputRange +")) AS myway2 ON (myway2.way=line1.way) WHERE (line1.highway IN ('path') OR aerialway NOT LIKE 'null') ORDER BY distance
  client.query("SELECT aerialway,line1.name, ST_AsGeoJSON(ST_Transform(line1.way,4326)) AS geometry, ST_Length(ST_Transform(line1.way,4326)::geography) AS linelength, ST_Distance(ST_Transform(line1.way,4326)::geography, ST_MakePoint(" + req.params.LNG +"," + req.params.LAT +")) AS distance FROM planet_osm_line AS line1 INNER JOIN (SELECT way FROM planet_osm_line AS pp WHERE ST_Length(ST_Transform(way,4326)::geography) > " + req.params.from + " AND ST_Length(ST_Transform(way,4326)::geography) < " + req.params.to + " AND ST_Dwithin(ST_MakePoint(" + req.params.LNG +"," + req.params.LAT +"), ST_Transform(way,4326)::geography, " + req.params.inputRange + ")) AS myway ON (myway.way=line1.way) WHERE (line1.highway IN ('path') OR aerialway NOT LIKE 'null') ORDER BY distance", function(err, result) {
    if(err) {
      return console.error('error running query', err);
    }
  client.end();

  result.rows.map(function(row){
    try {
      //console.dir(row.geometry);
      row.geometry = JSON.parse(row.geometry);
      row.type = "Feature";
      row.linelength = Math.round(row.linelength * 100) / 100;
      if(row.aerialway != null){
        row.properties = {"title": "Lanovka<br>Dĺžka: " + row.linelength, "stroke": "#FA8072", "distance": row.distance, "linelength": row.linelength, "marker-symbol": "lighthouse", "marker-size": "small", "marker-color": "#FF0000", "lanovka":true }
      } else {
        row.properties = {"title": "Dĺžka: " + row.linelength, "stroke": "#FA8072", "distance": row.distance, "linelength": row.linelength, "marker-symbol": "lighthouse", "marker-size": "small", "marker-color": "#FF0000", "lanovka":false }
      }    
    } catch (e) {
      console.log("catch")
      row.geometry = null;
    }
    return row;
   });
   res.end(JSON.stringify(result.rows));
  });
});

router.get('/interestsaroundhikingpath/:LAT/:LNG/:inputRangeEnd', function(req, res, next) {
  //console.log("zavolane");
  var client = new pg.Client(connString);
  
  client.connect();
  //SELECT amenity, tourism, historic, point1.natural, waterway, point1.name, ST_AsGeoJSON(ST_Transform(point1.way,4326)) AS geometry, ST_Distance(ST_Transform(way,4326)::geography, ST_MakePoint(" + req.params.LNG +"," + req.params.LAT +")) AS distance FROM planet_osm_point AS point1 WHERE ((amenity NOT LIKE 'null' AND amenity = 'shelter') OR (tourism NOT LIKE 'null' AND tourism IN('viewpoint')) OR (historic NOT LIKE 'null' AND historic IN('memorial')) OR (point1.natural NOT LIKE 'null' AND point1.natural IN('peak','cave_entrance','spring')) OR (waterway NOT LIKE 'null' AND waterway = 'waterfall')) AND point1.name NOT LIKE 'null' ORDER BY distance
  client.query("SELECT water, amenity, tourism, historic, point1.natural, waterway, point1.name, ST_AsGeoJSON(ST_Transform(point1.way,4326)) AS geometry, ST_Distance(ST_Transform(way,4326)::geography, ST_MakePoint(" + req.params.LNG +"," + req.params.LAT +")) AS distance FROM planet_osm_point AS point1 WHERE ST_Dwithin(ST_Transform(way,4326)::geography, ST_MakePoint(" + req.params.LNG +"," + req.params.LAT +"), " + req.params.inputRangeEnd + ") AND ((amenity NOT LIKE 'null' AND amenity = 'shelter') OR (tourism NOT LIKE 'null' AND tourism IN('viewpoint')) OR (historic NOT LIKE 'null' AND historic IN('memorial')) OR (point1.natural NOT LIKE 'null' AND point1.natural IN('peak','cave_entrance','spring')) OR (waterway NOT LIKE 'null' AND waterway = 'waterfall')) UNION SELECT water, amenity, tourism, historic, polygon1.natural, waterway, polygon1.name, ST_AsGeoJSON(ST_Transform(polygon1.way,4326)) AS geometry, ST_Distance(ST_Transform(way,4326)::geography, ST_MakePoint(" + req.params.LNG +"," + req.params.LAT +")) AS distance FROM planet_osm_polygon AS polygon1 WHERE ST_Dwithin(ST_Transform(way,4326)::geography, ST_MakePoint(" + req.params.LNG +"," + req.params.LAT +"), " + req.params.inputRangeEnd + ") AND (water = 'lake' AND (polygon1.name LIKE '%ples%' or polygon1.name LIKE '%plies%')) ORDER BY distance	", function(err, result) {
    if(err) {
      return console.error('error running query', err);
    }
  client.end();

  result.rows.map(function(row){
    try {
      //console.log(row);
      row.geometry = JSON.parse(row.geometry);
      row.type = "Feature";
      var roundedDistanca = Math.round(row.distance * 100) / 100;
      if(row.tourism == "viewpoint"){ //cervena
        var title = row.name != null ? row.name : "Výhliadka";
        row.properties = {"title": title + "<br>Vzdialenosť: " + roundedDistanca + " m", "marker-symbol": "lighthouse", "marker-size": "small", "marker-color": "#FF0000", "stroke": "#FF0000", "fill": "#FF0000", "distance":row.distance}
      }
      if(row.amenity == "shelter"){ //yelena
        var title = row.name != null ? row.name : "Úkryt";
        row.properties = {"title": title + "<br>Vzdialenosť: " + roundedDistanca + " m", "marker-symbol": "farm", "marker-size": "small", "marker-color": "#32CD32", "stroke": "#32CD32", "fill": "#32CD32", "distance":row.distance}
      }
      if(row.natural == "peak"){ //cierna
        var title = row.name != null ? row.name : "Vrch";
        row.properties = {"title": title + "<br>Vzdialenosť: " + roundedDistanca + " m", "marker-symbol": "triangle", "marker-size": "small", "marker-color": "#000000	", "stroke": "#000000	", "fill": "#000000	", "distance":row.distance}
      }
      if(row.natural == "cave_entrance"){ //siva
        var title = row.name != null ? row.name : "Jaskyňa";
        row.properties = {"title": title + "<br>Vzdialenosť: " + roundedDistanca + " m", "marker-symbol": "triangle-stroked", "marker-size": "small", "marker-color": "#808080", "stroke": "#808080", "fill": "#808080", "distance":row.distance}
      }
      if(row.natural == "spring"){ //modra silno
        var title = row.name != null ? row.name : "Prameň";
        row.properties = {"title": title + "<br>Vzdialenosť: " + roundedDistanca + " m", "marker-symbol": "water", "marker-size": "small", "marker-color": "#87CEFA", "stroke": "#87CEFA", "fill": "#87CEFA", "distance":row.distance}
      }
      if(row.historic == "memorial"){ //zltta
        var title = row.name != null ? row.name : "Pomník";
        row.properties = {"title": title + "<br>Vzdialenosť: " + roundedDistanca + " m", "marker-symbol": "monument", "marker-size": "small", "marker-color": "#FFFF00", "stroke": "#FFFF00", "fill": "#FFFF00", "distance":row.distance}
      }
      if(row.waterway == "waterfall"){ //modra slabo
        var title = row.name != null ? row.name : "Vodopád";
        row.properties = {"title": title + "<br>Vzdialenosť: " + roundedDistanca + " m", "marker-symbol": "water", "marker-size": "small", "marker-color": "#1E90FF", "stroke": "#1E90FF", "fill": "#1E90FF", "distance":row.distance}
      }
      if(row.water == "lake"){ //cerv
        row.properties = {"title": row.name + "<br>Vzdialenosť: " + roundedDistanca + " m", "stroke": "#FF0000", "fill": "#FF0000", "distance":row.distance}
      }
    } catch (e) {
      console.log("catch")
      row.geometry = null;
    }
    return row;
   });
   res.end(JSON.stringify(result.rows));
  });
});

router.get('/interestsaroundyou/:LAT/:LNG/:rangeAround', function(req, res, next) {

  var client = new pg.Client(connString);
  
  client.connect();
  
  client.query("SELECT water, public_transport, shop, highway, amenity, tourism, point1.name, ST_AsGeoJSON(ST_Transform(point1.way,4326)) AS geometry, ST_Distance(ST_Transform(way,4326)::geography, ST_MakePoint(" + req.params.LNG +"," + req.params.LAT +")) AS distance FROM planet_osm_point AS point1 WHERE ST_Dwithin(ST_Transform(way,4326)::geography, ST_MakePoint(" + req.params.LNG +"," + req.params.LAT +"), " + req.params.rangeAround + ") AND ((amenity NOT LIKE 'null' AND amenity IN ('toilets', 'atm', 'telephone', 'postbox')) OR (tourism NOT LIKE 'null' AND tourism IN ('guest_house','hotel','hostel')) OR (highway NOT LIKE 'null' AND highway IN ('bus_stop')) OR (shop NOT LIKE 'null' AND shop IN ('supermarket','convenience') AND point1.name NOT LIKE 'null') OR (railway NOT LIKE 'null' AND (public_transport NOT LIKE 'null' AND public_transport in ('stop_position')))) ORDER BY distance", function(err, result) {
    if(err) {
      return console.error('error running query', err);
    }
  client.end();

  result.rows.map(function(row){
    try {
      row.geometry = JSON.parse(row.geometry);
      row.type = "Feature";
      var roundedDistanca = Math.round(row.distance * 100) / 100;
      if(row.amenity == "toilets"){ //tmavozelena
        var title = row.name != null ? row.name : "WC";
        row.properties = {"title": title + "<br>Vzdialenosť: " + roundedDistanca + " m", "marker-symbol": "beer", "marker-size": "medium", "marker-color": "#008000", "stroke": "#008000", "fill": "#008000", "distance":row.distance, "stwithin" : row.stwithin }
      }
      if(row.amenity == "atm"){ //yelena
        var title = row.name != null ? row.name : "Bankomat";
        row.properties = {"title": title + "<br>Vzdialenosť: " + roundedDistanca + " m", "marker-symbol": "bank", "marker-size": "medium", "marker-color": "#7FFF00", "stroke": "#7FFF00", "fill": "#7FFF00", "distance":row.distance, "stwithin" : row.stwithin }
      }
      if(row.amenity == "telephone"){ //cierna
        var title = row.name != null ? row.name : "Telefón";
        row.properties = {"title": title + "<br>Vzdialenosť: " + roundedDistanca + " m", "marker-symbol": "telephone", "marker-size": "medium", "marker-color": "#000000	", "stroke": "#000000	", "fill": "#000000	", "distance":row.distance, "stwithin" : row.stwithin }
      }
      if(row.amenity == "postbox"){ //siva
        var title = row.name != null ? row.name : "Poštová schránka";
        row.properties = {"title": title + "<br>Vzdialenosť: " + roundedDistanca + " m", "marker-symbol": "post", "marker-size": "medium", "marker-color": "#808080", "stroke": "#808080", "fill": "#808080", "distance":row.distance, "stwithin" : row.stwithin }
      }
      if(row.tourism == "guest_house"){ //cervena
        var title = row.name != null ? row.name : "Privát";
        row.properties = {"title": title + "<br>Vzdialenosť: " + roundedDistanca + " m", "marker-symbol": "lodging", "marker-size": "medium", "marker-color": "#FF0000", "stroke": "#FF0000", "fill": "#FF0000", "distance":row.distance, "stwithin" : row.stwithin }
      }
      if(row.tourism == "hotel"){ //bordova
        var title = row.name != null ? row.name : "Hotel";
        row.properties = {"title": title + "<br>Vzdialenosť: " + roundedDistanca + " m", "marker-symbol": "lodging", "marker-size": "medium", "marker-color": "#8B0000", "stroke": "#8B0000", "fill": "#8B0000", "distance":row.distance, "stwithin" : row.stwithin }
      }
      if(row.tourism == "hostel"){ //salmon
        var title = row.name != null ? row.name : "Hostel";
        row.properties = {"title": title + "<br>Vzdialenosť: " + roundedDistanca + " m", "marker-symbol": "lodging", "marker-size": "medium", "marker-color": "#FA8072", "stroke": "#FA8072", "fill": "#FA8072", "distance":row.distance, "stwithin" : row.stwithin }
      }
      if(row.highway == "bus_stop"){ //oranzova
        var title = row.name != null ? row.name : "Autobusová zastávka";
        row.properties = {"title": title + "<br>Vzdialenosť: " + roundedDistanca + " m", "marker-symbol": "bus", "marker-size": "medium", "marker-color": "#FF4500", "stroke": "#FF4500", "fill": "#FF4500", "distance":row.distance, "stwithin" : row.stwithin }
      }
      if(row.public_transport == "stop_position"){ //hneda
        var title = row.name != null ? row.name : "Vlaková zastávka";
        row.properties = {"title": title + "<br>Vzdialenosť: " + roundedDistanca + " m", "marker-symbol": "rail", "marker-size": "medium", "marker-color": "#8B4513", "stroke": "#8B4513", "fill": "#8B4513", "distance":row.distance, "stwithin" : row.stwithin }
      }
      if(row.shop == "supermarket"){ //zlta
        var title = row.name != null ? row.name : "Supermarket";
        row.properties = {"title": "Supermarket " + title + "<br>Vzdialenosť: " + roundedDistanca + " m", "marker-symbol": "grocery", "marker-size": "medium", "marker-color": "#87CEFA", "stroke": "#87CEFA", "fill": "#87CEFA", "distance":row.distance, "stwithin" : row.stwithin }
      }
      if(row.shop == "convenience"){ //biela
        var title = row.name != null ? row.name : "Obchod";
        row.properties = {"title": "Obchod " + title + "<br>Vzdialenosť: " + roundedDistanca + " m", "marker-symbol": "grocery", "marker-size": "medium", "marker-color": "#1E90FF", "stroke": "#1E90FF", "fill": "#1E90FF", "distance":row.distance, "stwithin" : row.stwithin }
      }
    } catch (e) {
      console.log("catch")
      row.geometry = null;
    }
    return row;
   });
   res.end(JSON.stringify(result.rows));
  });
});

router.get('/hikingpathsrails/:rangeRails/:from/:to', function(req, res, next) {
  var client = new pg.Client(connString);

  client.connect();
  
  client.query("SELECT aerialway, line1.natural,line1.name,ST_AsGeoJSON(ST_Transform(line1.way,4326)) AS geometry, ST_Distance(ST_Transform(line1.way,4326)::geography, ST_Transform(stoprails.way,4326)::geography) AS distance, ST_Length(ST_Transform(line1.way,4326)::geography) AS linelength, stoprails.name, ST_AsGeoJSON(ST_Transform(stoprails.way,4326)) AS geometrystation FROM planet_osm_line AS line1 INNER JOIN (SELECT DISTINCT name, way FROM planet_osm_point WHERE railway='station' AND public_transport='stop_position') AS stoprails ON ST_DWithin(ST_Transform(stoprails.way,4326)::geography, ST_Transform(line1.way, 4326)::geography," + req.params.rangeRails + ") AND (ST_Length(ST_Transform(line1.way,4326)::geography) > " + req.params.from + " AND ST_Length(ST_Transform(line1.way,4326)::geography) < " + req.params.to + ") WHERE (line1.highway IN ('path') OR aerialway NOT LIKE 'null')	", function(err, result) {
    if(err) {
      return console.error('error running query', err);
    }
  client.end();

  result.rows.map(function(row){
    try {
      row.geometry = JSON.parse(row.geometry);
      row.geometrystation = JSON.parse(row.geometrystation);
      row.type = "Feature";
      row.linelength = Math.round(row.linelength * 100) / 100;
      if(row.aerialway != null){
        row.properties = {"title": "Lanovka<br>Dĺžka: " + row.linelength, "stroke": "#FA8072", "distance": row.distance, "linelength": row.linelength, "marker-symbol": "lighthouse", "marker-size": "small", "marker-color": "#FF0000", "lanovka":true }
      } else {
        row.properties = {"title": "Dĺžka: " + row.linelength, "stroke": "#FA8072", "distance": row.distance, "linelength": row.linelength, "marker-symbol": "lighthouse", "marker-size": "small", "marker-color": "#FF0000", "lanovka":false }
      } 
    } catch (e) {
      console.log("catch")
      row.geometry = null;
    }
    return row;
   });
   res.end(JSON.stringify(result.rows));
  });
});

module.exports = router;
