import json
from bs4 import BeautifulSoup, SoupStrainer
import httplib2
import sys

## Get the URL from the command line
url = sys.argv[1]

## Remove anchors from URL
if '#' in url:
    url = url.split('#')[0]

http = httplib2.Http()
status, response = http.request(url)

links = []
for link in BeautifulSoup(response, parse_only=SoupStrainer('a'), features="lxml"):
    if hasattr(link, "href"):
        if link.string is not None:

            # If the link is relative, make it absolute
            if not link['href'].startswith('http'):
                if url.endswith('/'):
                    link['href'] = url + link['href']
                else:
                    link['href'] = url + '/' + link['href']

            links.append({'href': link['href'], 'text': str(link.string)})

##Stringify for output to stdout
print(json.dumps(links, indent=4, sort_keys=True, default=str))