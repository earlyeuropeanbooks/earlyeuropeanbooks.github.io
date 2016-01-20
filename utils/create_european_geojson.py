import sys, json

idVal = 0

with open("../json/geojson/countries.geojson", 'r') as f:
  j = json.load(f)

  europeanJson = {"type":"FeatureCollection", "features":[]}

  # the values of the countries.json["features"] list 
  # are all individual countries
  with open("../json/geojson/europeanCountries.geojson",'w') as out:
    for countryFeatures in j["features"]:

      # only examine european countries
      if countryFeatures["properties"]["region_un"] == "Europe":

        # remove all unnecessary content from json 
        countryDict = {"type":"Feature", 
          "id": idVal, 
          "properties":
            {"name": countryFeatures["properties"]["name"], 

            # add random val for density
            "density": idVal},
          
          # add the geometry polygon
          "geometry": countryFeatures["geometry"]}
      
        # add one to the unique identifier counter
        idVal += 1
        
        europeanJson["features"].append(countryDict)

    json.dump(europeanJson, out)
