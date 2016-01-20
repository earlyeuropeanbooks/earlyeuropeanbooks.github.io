import codecs, sys, json, os

# read in ../data/EEB-1-7.txt
# and write book title, author, pub loc and pub date
# to a json file with the given book's id as the file
# name

if not os.path.exists("../json/book_template_json"):
  os.makedirs("../json/book_template_json")

############################
# write book template json #
############################

with codecs.open(sys.argv[1], 'r', 'latin1') as f:
  rows = f.readlines()

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

    except IndexError:
      pass

    # remove quote marks from fields
    short_title = short_title.replace('"','')
    author = author.replace('"','')
    standardized_place = standardized_place.replace('"','')
    pub_year = pub_year.replace('"','')

    book_template_json = {
      "title": short_title,
      "id": id,
      "author": author,
      "language": language,
      "pub_year": pub_year,
      "imprint": imprint,
      "pub_loc": standardized_place}  

    # if the book's id isn't an integer, don't persist it  
    try:
      float(id)
    except:
      print "couldn't process record id", "".join(i for i in " ".join(id.split()) if ord(i) < 128)
      continue   

    with open("../json/book_template_json/" + 
      str(id) + "_template.json", 'w') as book_template_json_out:
      json.dump(book_template_json, book_template_json_out) 

