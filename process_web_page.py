import json
from newsplease import NewsPlease
import sys

## Get the URL from the command line
url = sys.argv[1]

article = NewsPlease.from_url(url)

## Get article as dict
article_dict = article.get_dict()

##Stringify for output to stdout
print(json.dumps(article_dict, indent=4, sort_keys=True, default=str))