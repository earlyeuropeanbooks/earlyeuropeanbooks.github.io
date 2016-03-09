from collections import defaultdict
import codecs, sys, json

# read in ../data/eeb-1-7-utf16.txt

# set a minimum number of observations we need to have per source library
# in order to persist that source library to disk
minimum_observations = 10

########################
# write languages json #
########################

with codecs.open(sys.argv[1], 'r', 'utf-16') as f:
  rows = f.readlines()

  source_libraries = defaultdict(int)

  for c, r in enumerate(rows[1:-1]):
    rs = r.split("\t")

    try:
      id = rs[0]
      prq_unique_id = rs[1]
      author = rs[2]
      short_title = rs[3]
      imprint = rs[4]
      standardized_place = rs[5]
      pub_year = rs[6]
      language = rs[7]
      classification_one = rs[8]
      classification_two = rs[9]
      classification_three = rs[10]
      source_library = rs[11] 

      # if the book id isn't numeric, this row is misinterpreted, so don't
      # add the record's language to our counts
      try:
        float(id)
      except:
        print "couldn't process id:", "".join(l for l in 
        " ".join(id.split()) if ord(l) < 128)
        continue

      # clean the source library string
      source_library = source_library.replace('"','')
      
      # remove lengthy strings
      source_library = source_library.replace("Det Kongelige Bibliotek -",'')
      source_library = source_library.replace("Koninklijke Bibliotheek,", '')
      source_library = source_library.strip()

      source_libraries[source_library] += 1

    except IndexError:
      pass

  # create list in which we'll store the clean language dicts
  clean_source_libraries = []
  for c2, source_library in enumerate(source_libraries.iterkeys()):

    if not source_library:
      continue

    # check to see if the number of observations is below the minimum
    # number of observations
    if source_libraries[source_library] < minimum_observations:
      continue

    source_library_dict = {
        "selectionGroup": "sourceLibrary",
        "selectionString": source_library,
        "selectionStringRaw": source_library,
        "selectionId": c2,
        "selectionCount": source_libraries[source_library]}
    clean_source_libraries.append(source_library_dict)

  # sort the list of classifications alphabetically
  sorted_source_libraries = sorted(clean_source_libraries, key=lambda k: k["selectionString"])

  with open("../json/source_libraries.json",'w') as source_libraries_out:
    json.dump( sorted_source_libraries, source_libraries_out)
