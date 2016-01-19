from collections import defaultdict
import urllib2, codecs, sys, re, os, urlparse, string, json, random

# this script takes as input a matrix such as ../data/EEB-1-7.txt
# and generates output in the json/ directory
# usage: python geocode.py "../data/EEB-1-7.txt" 


################
# url to ascii #
################

def urlEncodeNonAscii(b):
    return re.sub('[\x80-\xFF]', lambda c: '%%%02x' % ord(c.group(0)), b)


def fixurl(url):
    # turn string into unicode
    if not isinstance(url,unicode):
        url = url.decode('utf-8')

    # parse it
    parsed = urlparse.urlsplit(url)

    # divide the netloc further
    userpass,at,hostport = parsed.netloc.rpartition('@')
    user,colon1,pass_ = userpass.partition(':')
    host,colon2,port = hostport.partition(':')

    # encode each component
    scheme = parsed.scheme.encode('utf-8')
    user = urllib2.quote(user.encode('utf-8'))
    colon1 = colon1.encode('utf-8')
    pass_ = urllib2.quote(pass_.encode('utf-8'))
    at = at.encode('utf-8')
    host = host.encode('idna')
    colon2 = colon2.encode('utf-8')
    port = port.encode('utf-8')
    path = '/'.join(  # could be encoded slashes!
        urllib2.quote(urllib2.unquote(pce).encode('utf-8'),'')
        for pce in parsed.path.split('/')
    )
    query = urllib2.quote(urllib2.unquote(parsed.query).encode('utf-8'),'=&?/')
    fragment = urllib2.quote(urllib2.unquote(parsed.fragment).encode('utf-8'))

    # put it back together
    netloc = ''.join((user,colon1,pass_,at,host,colon2,port))
    return urlparse.urlunsplit((scheme,netloc,path,query,fragment))


def iriToUri(iri):
    parts= urlparse.urlparse(iri)
    return urlparse.urlunparse(
        part.encode('idna') if parti==1 else urlEncodeNonAscii(part.encode('utf-8'))
        for parti, part in enumerate(parts)
    )

#############################
# ping google geocoding api #
#############################

# make outfile directory
if not os.path.exists("../json/locations"):
  os.makedirs("../json/locations")

def retrieve_locations():
  """Read in eeb spreadsheet and retrieve location json for each location"""
  locations = []

  with codecs.open(sys.argv[1], 'r', 'latin1') as f:
    rows = f.readlines()
    for r in rows[1:-1]:
      try:
        sr = r.split("\t")
        clean_location = sr[5]  
        locations.append(clean_location)

      except IndexError:
        pass

  unique_locations = list(set(locations))
  return unique_locations


def retrieve_location_json(unique_locations):
  """Retrieve json for each location and write that json to disk"""
  location_id_to_name = {}

  google_api_key = 'AIzaSyDmBh4pBQOekQp2tGuaMoub3DhEmyY48PA'
  url_root = 'https://maps.googleapis.com/maps/api/geocode/json?address='
  url_suffix ='&key=' + google_api_key

  for c, loc in enumerate(unique_locations):
    location_id_to_name[c] = loc

    if not loc:
      continue
    if "(" in loc:
      loc = "".join(j for j in loc.split("(")[1] if j.isalpha() or j == " ")
    if "_" in loc:
      loc = loc.replace("_"," ")

    # clean the location url
    loc = loc.strip()
    plus_loc = "+".join( re.split("\s+", loc) ) + "+Europe"
    url = url_root + plus_loc + url_suffix

    # format url with ascii characters
    clean_url = iriToUri(url)
    clean_url = fixurl(clean_url)

    # place request and retrieve url
    response = urllib2.urlopen(clean_url)
    response_encoding = response.headers["content-type"].split("charset=")[-1]
    html = response.read()
    unicode_content = unicode(html, response_encoding)  
    location_json = json.loads(unicode_content)

    # write json to disk
    with open("../json/locations/" + str(c) + ".json", 'w') as location_json_out:
      json.dump(location_json, location_json_out) 
  
  # write a mapping from location id to location string
  with open("../json/location_id_to_string.json", 'w') as location_ids_out:
    json.dump(location_id_to_name, location_ids_out)


def write_map_location_json():
  """Write json to disk for each location to be plotted"""
  with open("../json/location_id_to_string.json") as f:
    location_id_to_string = json.load(f)
    string_to_location_id = {v:k for k, v in location_id_to_string.items()}

  book_locations_json = []
  locations_counter = defaultdict(int)

  with codecs.open(sys.argv[1], 'r', 'latin1') as f:
    rows = f.readlines()
    for r in rows[1:-1]:
      try:
        sr = r.split("\t")
        id = sr[0]
        prq_id = sr[1]
        clean_location = sr[5]  

        # use the location's id (if available) to retrieve lat longs 
        # from persisted json
       
        # try to retrieve the location's id 
        try:
          location_id = string_to_location_id[clean_location]
        except KeyError:
          continue

        # check to see if we've already written the maximum number
        # of observations for this location
        locations_counter[location_id] += 1
        if locations_counter[location_id] > max_observations_per_location:
          continue

        # try to retrieve the location's geocoordinates
        try:
          with open("../json/locations/" + str(location_id) + ".json") as f:
            incoming_location_json = json.load(f)

            lat_long = incoming_location_json["results"][0]["geometry"]["location"]
            lat = lat_long["lat"]
            lng = lat_long["lng"]
  
            # if user wants to perturb the lat long values,
            # spread them out from their city of origin slightly
            if perturb_locations == 1:
              lat = lat + random.uniform(0, .1)
              lng = lng + random.uniform(0, .1)

            book_locations_json.append( {"id":id, "lat":lat, "lng":lng} ) 

        except IOError:
          continue

      except IndexError:
        continue

  with open("../json/book_locations.json",'w') as book_locations_json_out:
    json.dump(book_locations_json, book_locations_json_out)


if __name__ == "__main__":
  perturb_locations = 1
  max_observations_per_location = 20 
 
  #unique_locations = retrieve_locations()
  #retrieve_location_json(unique_locations)
  write_map_location_json()
