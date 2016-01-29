import codecs, sys, json, os, glob

# read in ../data/eeb-1-7-utf16.txt
# and write book title, author, pub loc and pub date
# to a json file with the given book's id as the file
# name

if not os.path.exists("../json/book_templates"):
  os.makedirs("../json/book_templates")

########################
# retrieve book images #
########################

def retrieve_image_paths():
  """create a dictionary whose keys are prqids and values 
  are paths to the image for that prqid"""
  image_paths = {}
  for i in glob.glob("../images/*.jpg"):

    # use full images, not thumbs
    if ".thumb.jpg" in i:
      continue
    prqid = "-".join( i.split("-")[:-1] )

    # set the id key equal to /images/ + image filename
    image_paths[ os.path.basename(prqid) ] = "/images/" + os.path.basename(i)
  return image_paths


############################
# write book template json #
############################

def write_book_template_json(image_paths):
  """Write json metadata for each individual book"""
  with codecs.open(sys.argv[1], 'r', 'utf-16') as f:
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

        # use the image paths dict to retrieve path to image
        # of this record; because not all records have images,
        # use try, except
        try:
          image_path = image_paths[prq_unique_id]
        except KeyError:
          image_path = "/img/placeholder.png"

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
        "pubYear": pub_year,
        "imprint": imprint,
        "pubLoc": standardized_place,
        "prqId": prq_unique_id,
        "imagePath": image_path}  

      # if the book's id isn't an integer, don't persist it  
      try:
        float(id)
      except:
        print "couldn't process record id", "".join(
            i for i in " ".join(id.split()) if ord(i) < 128)
        continue   

      with open("../json/book_templates/" + 
        str(id) + "_template.json", 'w') as book_template_json_out:
        json.dump(book_template_json, book_template_json_out) 


if __name__ == "__main__":
  image_paths = retrieve_image_paths()  
  write_book_template_json( image_paths ) 
