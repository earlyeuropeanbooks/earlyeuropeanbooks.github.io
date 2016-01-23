from __future__ import division
from collections import defaultdict
import urllib2, codecs, sys, re, os, urlparse, string, json, random

# this script takes as input a matrix such as ../data/EEB-1-7.txt
# and generates output in the json/ directory
# usage: python geocode.py "../data/eeb-1-7-utf16.txt" 

# TODO: update 'perturbance' value as a function of the number of observations
# we have for the given location, in order to make sure that cities with
# one observation, e.g., position that observation directly on the geocoordinates
# of the city 

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

if not os.path.exists("../json/language_selections"):
  os.makedirs("../json/user_selections/language_selections")

if not os.path.exists("../json/classification_selections"):
  os.makedirs("../json/user_selections/classification_selections")

def retrieve_locations():
  """Read in eeb spreadsheet and retrieve location json for each location"""
  locations = []

  with codecs.open(sys.argv[1], 'r', 'utf-16') as f:
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


def map_classification_string_to_id():
  """Read in the classifications.json to map classification strings to
  their respective classification ids"""
  classification_string_to_id = {}
  with open("../json/classifications.json") as f:
    f = json.load(f)
    for d in f:
      classification_string_to_id[ d["selectionStringRaw" ] ] = d["selectionId"]
  return classification_string_to_id


def map_language_string_to_id():
  """Read in the languages.json to map language strings to 
  their respective language ids"""
  language_string_to_id = {}
  with open("../json/languages.json") as f:
    f = json.load(f)
    for d in f:
      language_string_to_id[ d["selectionStringRaw" ] ] = d["selectionId"]
  return language_string_to_id


def write_map_location_json():
  """Write json to disk for each location to be plotted"""
  with open("../json/location_id_to_string.json") as f:
    location_id_to_string = json.load(f)
    string_to_location_id = {v:k for k, v in location_id_to_string.items()}

  # map classification string to id so we can persist classification id
  # as a class value within each book's point on the map
  classification_string_to_id = map_classification_string_to_id()
  language_string_to_id = map_language_string_to_id()

  book_locations_json = []

  # create a counter that can keep track of the number of times each location
  # occurs in the dataset, so we can set a maximum number of observations
  # for each location to limit DOM strain when loading the page initially
  locations_counter = defaultdict(int)

  # for each selection type {classification, language} for each value
  # in that selection, populate a full list of json so that we can populate
  # all observations for that value within the selection (e.g. plot all
  # books with classificationId == witchcraft, not just the subset that
  # happen to have been included in the initial page json, which is limited
  # by the maximum observations per location
  selection_json = {"classification": defaultdict(list), "language": defaultdict(list)}

  # create another counter that will count the number of observations for each location
  # for each selection id for each selection occurs. We don't want to plot 10,000 
  # observations with language "French" from Paris, because this makes elements
  # unclickable and oversaturates the DOM
  selection_json_counter = {"classification": defaultdict(lambda: defaultdict(int)),
      "language": defaultdict(lambda: defaultdict(int))}

  with codecs.open(sys.argv[1], 'r', 'utf-16') as f:
    rows = f.readlines()
    for r in rows[1:-1]:
      try:
        sr = r.split("\t")
        id = sr[0]
        prq_id = sr[1]
        clean_location = sr[5]
        language_string = sr[7] 
        classification_string = sr[8] 

        # if the book id isn't numeric, this row is misinterpreted, so don't
        # persist the record
        try:
          float(id)
        except:
          print "couldn't persist id:", "".join(l for l in 
          " ".join(id.split()) if ord(l) < 128)
          continue

        # we don't persist empty classification 
        # or language strings so try/except
        try:
          language_id = language_string_to_id[language_string]
        except KeyError:
          language_id = ''

        # we don't persist empty classification strings 
        # or their ids, so try/except
        try:
          classification_id = classification_string_to_id[classification_string]
        except KeyError:
          classification_id = ''

        # use the location's id (if available) to retrieve lat longs 
        # from persisted json
       
        # try to retrieve the location's id 
        try:
          location_id = string_to_location_id[clean_location]
        except KeyError:
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
              # use coin flip to determine whether sign is positive or negative
              lat = lat + random.uniform(-perturb_limit, perturb_limit)
              lng = lng + random.uniform(-perturb_limit, perturb_limit)

            # to minimize json size, only record three decimal places
            lat = int(lat*1000)/1000
            lng = int(lng*1000)/1000

            # to further reduce json size, coerce ids into integers
            id = int(id)

            # create the book level information we'll use to plot the 
            # book on the map
            book_location_dict = {"id":id, "lat":lat, 
                "lng":lng, "classificationId": classification_id, 
                "languageId": language_id}

            # check to make sure we haven't reached the maximum
            # number of observations for the current selection in the current
            # city
            selection_json_counter["classification"][classification_id][location_id] += 1
            selection_json_counter["language"][language_id][location_id] += 1

            # when a user clicks on a bar of the barplot, we want to 
            # plot all records with the given language or classification
            # id. For example, if a user clicks on "Culinary arts", we want
            # to plot the records with culinary arts books, so build up
            # a dictionary for each selection id of each selection group
            # [currently limited to a book's classification or language]

            # before adding the current observation to its selection json,
            # make sure that we haven't already recorded the maximum
            # number of observations for the current location
            if (selection_json_counter["classification"][classification_id][location_id] <
                max_observations_per_location):
                selection_json["classification"][classification_id].append(
                    book_location_dict)
        
            if (selection_json_counter["language"][language_id][location_id] <
                max_observations_per_location):
                selection_json["language"][language_id].append(
                    book_location_dict)

            # check to see if we've already added the maximum number
            # of observations for this location to the initial page load json
            locations_counter[location_id] += 1
            if locations_counter[location_id] > max_observations_per_location:
              continue

            book_locations_json.append(book_location_dict) 

        except IOError:
          continue

      except IndexError:
        continue

  # write the json to be used on initial page load
  with open("../json/page_load_book_locations.json",'w') as book_locations_json_out:
    json.dump(book_locations_json, book_locations_json_out)

  # write the full json for each selection id {0:n} of each possible selection
  # {classification, language}
  for selection_type_key in selection_json:
    for selection_id_key in selection_json[selection_type_key]:
      outgoing_json_file = ("../json/user_selections/" + 
          selection_type_key + "_selections/" +  
          selection_type_key + "_" + str(selection_id_key) + ".json")

      with open(outgoing_json_file, 'w') as selection_json_out:
        json.dump(selection_json[selection_type_key][selection_id_key],
            selection_json_out)


if __name__ == "__main__":
  perturb_locations = 1
  perturb_limit = .3
  max_observations_per_location = 20 
 
  #unique_locations = retrieve_locations()
  #retrieve_location_json(unique_locations)
  write_map_location_json()
