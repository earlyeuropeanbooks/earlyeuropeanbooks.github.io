from collections import defaultdict, OrderedDict
import codecs, sys, json

# read in ../data/eeb-1-7.txt

##############################
# write classifications json #
##############################

with codecs.open(sys.argv[1], 'r', 'utf-16') as f:
  rows = f.readlines()

  classifications = defaultdict(int)

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
      copy_location = rs[11] 

      # if the book id isn't numeric, this row is misinterpreted, so don't
      # count the record's classification towards classification counts
      try:
        float(id)
      except:
        print "couldn't process id:", "".join(l for l in 
        " ".join(id.split()) if ord(l) < 128)
        continue

      classifications[classification_one] += 1

    except IndexError:
      pass

  # manually shorten long subject classifications
  classification_overrides = {
    "Dictionaries, vocabularies, phrase books, instruction in foreign languages": "Dictionaries and phrase books",
    "Agriculture, viticulture, texts on hunting, veterinary science": "Agriculture and hunting",
    "Travel, topography, maps and navigational manuals": "Travel, topography, & maps",
    "Courtesy, civil conversation, etiquette, sumptuary": "Courtesy, etiquette, & sumptuary",
    "Adages, aphorisms, emblem books, jests, proverbs": "Aphorisms & emblam books",
    "dialectics and rhetoric": "Dialectics and rhetoric"}

  # clean classification dict and write to disk
  clean_classifications = []
  for c2, k in enumerate(classifications):
    if not k:
      continue

    classification = k.replace('"','').strip()
    if classification in classification_overrides.iterkeys():
      classification = classification_overrides[classification]

    # trim excessive classifications
    classification = classification.split("(")[0]

    """persist the selection group (classification), the string value 
    the current observation has for that group (e.g. "Military 
    handbooks"), the numeric id for that value, and the count of times 
    the current string value occurs in the corpus. Also, save the raw 
    form of the classification string"""

    """selection string will be displayed to user, selection string 
    raw indicates the selection string as it exists in the 
    spreadsheet, and is only persisted for mapping selection strings 
    back to their ids"""

    classification_dict = {
        "selectionGroup": "classification",
        "selectionString": classification,
        "selectionStringRaw": k,
        "selectionId": c2,
        "selectionCount": classifications[k]}
    clean_classifications.append(classification_dict)

  # sort the list of classifications alphabetically
  sorted_classifications = sorted(clean_classifications, key=lambda k: k["selectionString"])

  with open("../json/classifications.json",'w') as classifications_out:
    json.dump( sorted_classifications, classifications_out)


