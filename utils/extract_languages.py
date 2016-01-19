from collections import defaultdict, OrderedDict
import codecs, sys, json

# read in ../data/EEB-1-7.txt

# set a minimum number of observations we need to have per language
# in order to persist that language to disk
minimum_observations = 10

########################
# write languages json #
########################

with codecs.open(sys.argv[1], 'r', 'latin1') as f:
  rows = f.readlines()

  languages = defaultdict(int)

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

      languages[language] += 1

    except IndexError:
      pass

  # create list in which we'll store the clean language dicts
  clean_languages = []
  for c2, language in enumerate(languages.iterkeys()):

    if not language:
      continue

    # check to see if the number of observations is below the minimum
    # number of observations
    if languages[language] < minimum_observations:
      continue

    language_dict = {
        "selectionGroup": "language",
        "selectionString": language,
        "selectionStringRaw": language,
        "selectionId": c2,
        "selectionCount": languages[language]}
    clean_languages.append(language_dict)

  # sort the list of classifications alphabetically
  sorted_languages = sorted(clean_languages, key=lambda k: k["selectionString"])

  with open("../json/languages.json",'w') as languages_out:
    json.dump( sorted_languages, languages_out)


