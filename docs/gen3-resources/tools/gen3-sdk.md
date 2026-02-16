

# Using the Gen3 Python SDK
To make programmatic interaction with Gen3 data commons easier, the bioinformatics team at the Center for Translational Data Science (CTDS) at University of Chicago has developed the Gen3 Python SDK, which is a Python library containing functions for sending standard requests to the Gen3 APIs. The code is open-source and available on [GitHub][Gen3 Python SDK Github] along with [documentation for using it][Gen3 Python SDK doc].

The SDK includes the following classes of functions:

1. [*Gen3Auth*][Gen3Auth], which generates access tokens from API keys downloaded from your data commons to support JWT-based authentication.   
2. [*Gen3Submission*][Gen3Submission], which interacts with the Gen3’s submission service including GraphQL queries.  
3. [*Gen3Index*][Gen3Index], which interacts with the Gen3’s Indexd service for GUID brokering and resolution.  
4. [*Gen3Query*][Gen3Query], which interacts with Gen3's Guppy service to search Elasticsearch.  
5. [*Gen3File*][Gen3File], which allows Gen3 file management through presigned URLs.  
6. [*Gen3WsStorage*][Gen3WsStorage], which interacts with the Gen3 workspace storage service.
7. [*Gen3Jobs*][Gen3Jobs], which interacts with the Gen3’s Job Dispatching Service, Sower. This can be used to [run any jobs from this service][sower jobs].
8. [*Gen3 Tools (various)*][Gen3 Tools]:  
    * [DRS Download tools][DRS Download tools]: for downloading and listing JSON DRS manifest and DRS objects  
    * [Indexing tools][Indexing tools]: for downloading a manifest of indexed file objects, indexing object files in a manifest, and verifying a manifest of indexed file objects  
    * [Metadata tools][Metadata tools]:  for ingesting a CSV/TSV metadata manifest into the Metdata Service  
<!-- commenting this out because we're not sure this is still functional 
10. [*Gen3Object*][Gen3Object] -->

Below is a selection of commonly used functions along with [notebooks demonstrating their use][Jupyter demos].

## Getting Started

The Gen3 SDK can be installed using “pip”, the package installer for Python. For installation details, see [this documentation][Gen3 Python SDK install].

```python
# Install Gen3 SDK:
pip install gen3

# To clone and develop the source:
git clone https://github.com/uc-cdis/gen3sdk-python.git

# Use the `!` magic command to clone and develop the python SDK in the workspace:
!git clone https://github.com/uc-cdis/gen3sdk-python.git

# As the Gen3 community updates repositories, keep them up to date using:
git pull origin master
```

## Examples

### Gen3 Auth class  

Most requests sent to a Gen3 data commons API will require an authorization token to be sent in the request’s header. The SDK class *Gen3Auth* is used for authentication purposes, and generates these access tokens from the [credentials that can be downloaded from the commons Profile page](./user-guide/using-api/#credentials-to-send-api-requests). The code below expects that the credentials.json 

   When using the Gen3 SDK from the terminal, users do need to authenticate, but users working from the workspace do not need to authenticate after  logging in to the Data Commons.

From the python shell, run the following:

```python
import gen3
from gen3.auth import Gen3Auth
from pathlib import Path # this is just for ease of specifying your home directory
home = str(Path.home())

endpoint = "https://gen3.datacommons.io" # no slash after endpoint
creds = f"{home}/Downloads/credentials.json"
auth = Gen3Auth(endpoint, refresh_file=creds)
```

### Gen3 Submission class  

The [Gen3Submission][Gen3Submission Python SDK class] class of the Gen3 SDK has functions for sending and retrieving structured data to the graph database service (Sheepdog) API. Users can refine their retrieval by using the graphQL schema of the data commons and graphQL queries. Queries can be used to pinpoint specific data of interest by providing query arguments that act as filters on records in the database and providing lists of properties to retrieve for those records. If all the structured data in a record or node is desired, as opposed to only specific properties, then see the export functions below.

Entire structured data records can be exported as a JSON or TSV file using the Gen3Submission Gen3 SDK class. The export_record function will export a single structured metadata record in a specific node of a specific project, whereas the export_node function will export all the structured metadata records in a specified node of a specific project.  

#### `Gen3Submission.get_programs`  

All available programs in the data commons will be shown with the function `get_programs`. The following commands:

```python
import gen3
from gen3.submission import Gen3Submission
sub = Gen3Submission(endpoint, auth)
sub.get_programs()
```
will return: `{'links': ['/v0/submission/OpenNeuro', '/v0/submission/GEO', '/v0/submission/OpenAccess', '/v0/submission/DEV']}`

#### `Gen3Submission.get_projects`  

All projects under a particular program (“OpenAccess”) will be shown with the function `get_projects`. The following commands:

```python
from gen3.submission import Gen3Submission
sub = Gen3Submission(endpoint, auth)
sub.get_projects("OpenAccess")
```

will return “CCLE” as the project under the program “OpenAccess”: `{'links': ['/v0/submission/OpenAccess/CCLE']}`

#### `Gen3Submission.export_node`  

All structured metadata stored under one node of a project in the graph Postgres database can be exported as a tsv file with the function `export_node`. The following commands:

```python
from gen3.submission import Gen3Submission
sub = Gen3Submission(endpoint, auth)
program = "OpenAccess"
project = "CCLE"
node_type = "aligned_reads_file"
fileformat = "tsv"
filename = "OpenAccess_CCLE_aligned_reads_file.tsv"
sub.export_node(program, project, node_type, fileformat, filename)
```
will return: `Output written to file: OpenAccess_CCLE_aligned_reads_file.tsv`

*A note to clarify that this will download the structured data (metadata) present in the graph database, and it does not download any data files that are referenced in this metadata.*  

### `Gen3Index`  

#### `Gen3Index.get_record`

The function `get_record` in the class *Gen3Index* is used to show all metadata associated with a given id by interacting with Gen3’s Indexd service. GUIDs can be found on the [Exploration page][Exploration page] under the `Files` tab. You can get the Indexd record for a specific GUID with the following commands:

```python
from gen3.index import Gen3Index
index = Gen3Index(endpoint, auth)  
ind_record_1 = index.get_record("92183610-735e-4e43-afd6-7b15c91f6d10")
print(ind_record_1)
```

This will return the contents of the Indexd record for the GUID: `{'acl': ['*'], 'authz': ['/programs/OpenAccess/projects/CCLE'], 'baseid': 'e9bd6198-300c-40c8-97a1-82dfea8494e4', 'created_date': '2020-03-13T16:08:53.743421', 'did': '92183610-735e-4e43-afd6-7b15c91f6d10', 'file_name': None, 'form': 'object', 'hashes': {'md5': 'cbccc3cd451e09cf7f7a89a7387b716b'}, 'metadata': {}, 'rev': '13077495', 'size': 15411918474, 'updated_date': '2020-03-13T16:08:53.743427', 'uploader': None, 'urls': ['https://api.gdc.cancer.gov/data/30dc47eb-aa58-4ff7-bc96-42a57512ba97'], 'urls_metadata': {'https://api.gdc.cancer.gov/data/30dc47eb-aa58-4ff7-bc96-42a57512ba97': {}}, 'version': None}`

###  Gen3File file upload and Gen3Index indexing  

This is an example workflow for uploading a file to the S3 bucket for the data commons, creating an Indexd record for the file, and then test download the file.  

Overview of the process:  

1) Import relevant libraries and instantiate the relevant Gen3 SDK classes
2) Create an example test file for uploading  
3) With `Gen3File.upload_file()`, get and use a presigned URL to upload the file to the data commons' S3 bucket   
4) Pull the Indexd GUID out of the presigned URL string  
5) Using the Indexd GUID, get the Indexd record contents with `Gen3Index.get_record`  
6) Use `Gen3Index.update_record()` to update the Indexd record to add values to `authz` and `acl`.  
7) Check that everything worked as expected by testing download of the file you just uploaded with `Gen3File.download_single()`  

```python
# 1) Import relevant libraries and instantiate the relevant Gen3 SDK classes 
import re
import gen3
from gen3.auth import Gen3Auth
from gen3.index import Gen3Index
from gen3.file import Gen3File

ex_api = 'https://staging.midrc.org'
cred = '/Users/cgmeyer/Downloads/midrc-staging-credentials.json'
auth = Gen3Auth(ex_api, refresh_file=cred)
index = Gen3Index(auth)
file = Gen3File(auth)

# 2) Create an example test file for uploading
!echo "This is just a test file. Delete me if you find me." >> test.txt
file_name = 'test.txt'

# 3) With `Gen3File.upload_file()`, get and use a presigned URL
# to upload the file to the data commons' S3 bucket
upload_url = file.upload_file(file_name)['url'] # Just the file name not the full path
with open(file_name,'rb') as f:
    response = requests.put(upload_url, data=f)
response.raise_for_status()
print(response.url)
# this is what you'll see  -
# 'https://<s3 bucket for commons>/<indexd GUID - often starts with dg.>/test.txt?<remainder of the presigned URL>'

# 4) Pull the Indexd GUID out of the presigned URL string 
pattern = rf'(dg\.[^/]+/[0-9a-fA-F\-]+)/{re.escape(file_name)}' # use this pattern if your GUIDs begin with dg.
match = re.search(pattern, response.url)
guid = match.group(1) if match else None
print(guid)

# 5) Using the Indexd GUID, get the Indexd record contents with `Gen3Index.get_record`
irec = index.get_record(guid)

# 6) Use `Gen3Index.update_record()` to update the Indexd record to add values to `authz` and `acl`.
authz=["/programs/Open"]
acl = ["*"]
index.update_record(guid, authz=authz, acl=acl)

# 7) Check that everything worked as expected by testing a download
# of the file you just uploaded with `Gen3File.download_single()` 
download_directory = "<path to directory to download file>"
file.download_single(guid, download_directory)
```

## Using the Gen3 SDK in the workspace: Jupyter Notebook Demos  

Below are three tutorial Jupyter Notebooks that demonstrate various Gen3 SDK functions that may be helpful for the analysis of data in a Gen3 workspace. You can also navigate to the notebook browser of [Gen3 Data Hub][Data Hub notebooks] or the [Biomedical Research Hub][BRH notebooks]to explore the notebooks.

1. Find this notebook [“Gen3_authentication notebook”][#1 Gen3_auth notebook] to help guide you how to authenticate from the terminal or from the workspace (download also as [.ipynb][#1 .ipynb] file). Note that users do need to authenticate when using the SDK from the terminal, but do not need to authenticate once being logged in and working in the workspace of a Data Commons.

2. Download node files, show/select data, and [plot with this notebook][#2 notebook canine] using data hosted on the [Canine Data Commons][Canine Data Commons]. Users can upload this notebook as an [.ipynb][#2 .ipynb] file to the workspace of the Canine Data Commons to start their analysis. Note, that bringing in files into the workspace as explained in this notebook can be also achieved on selected Data Commons by clicking the “Export to Workspace” button on the Exploration Page; please also note, that once files are exported from the Exploration page, users do not need to authenticate anymore in the workspace.

3. Download data files and metadata using the gen3-client and the Gen3 SDK, respectively, and bring them into the workspace. Run gene expression analysis and statistical analysis on the data files and metadata, respectively, and plot the outcome in different scenarios. This Jupyter [Data Analysis Notebook][#3 notebook] uses data hosted on the [Gen3 Data Hub][Gen3 Data Hub]. Upload this notebook as an [.ipynb][#3 .ipynb] file to the workspace of the Gen3 Data Hub and start your analysis. Note, that bringing in files into the workspace as explained in this notebook can be also achieved on selected Data Commons by clicking the “Export to Workspace” button on the Exploration Page; please also note, that once files are exported from the Exploration page, users do not need to authenticate anymore in the workspace.

When finished, please be sure to shut down the workspace server by clicking the “Terminate Workspace” button.

<!-- Using the Gen3 Python SDK -->
[Gen3 Python SDK Github]: https://github.com/uc-cdis/gen3sdk-python
[Gen3 Python SDK doc]: https://uc-cdis.github.io/gen3sdk-python/_build/html/index.html
[Gen3Auth]: https://uc-cdis.github.io/gen3sdk-python/_build/html/auth.html  
[Gen3Submission]: https://uc-cdis.github.io/gen3sdk-python/_build/html/submission.html  
[Gen3Index]: https://uc-cdis.github.io/gen3sdk-python/_build/html/indexing.html  
[Gen3Query]: https://uc-cdis.github.io/gen3sdk-python/_build/html/query.html
[Gen3File]: https://uc-cdis.github.io/gen3sdk-python/_build/html/file.html 
[Gen3WsStorage]: https://uc-cdis.github.io/gen3sdk-python/_build/html/wss.html
[Gen3Jobs]: https://uc-cdis.github.io/gen3sdk-python/_build/html/jobs.html
[sower jobs]: https://github.com/uc-cdis/sower-jobs  
[Gen3 Tools]: https://uc-cdis.github.io/gen3sdk-python/_build/html/tools.html  
[DRS Download tools]: https://uc-cdis.github.io/gen3sdk-python/_build/html/tools/drs_pull.html 
[Indexing tools]: https://uc-cdis.github.io/gen3sdk-python/_build/html/tools/indexing.html
[Metadata tools]: https://uc-cdis.github.io/gen3sdk-python/_build/html/tools/metadata.html  
[Gen3Object]: https://uc-cdis.github.io/gen3sdk-python/_build/html/object.html
[Jupyter demos]: gen3-sdk.md#jupyter-notebook-demos
[Gen3 Python SDK install]: https://github.com/uc-cdis/gen3sdk-python/blob/master/README.md
[Data Hub notebooks]: https://gen3.datacommons.io/resource-browser
[BRH notebooks]: https://brh.data-commons.org/resource-browser
[Exploration page]: https://gen3.datacommons.io/explorer
[#1 Gen3_auth notebook]: notebooks/Gen3_authentication.html
[#1 .ipynb]: notebooks/Gen3_authentication.ipynb
[#2 notebook canine]: notebooks/notebook2_canine.html
[Canine Data Commons]: https://caninedc.org/
[#2 .ipynb]: notebooks/notebook2_canine.ipynb
[#3 notebook]: notebooks/notebook3_gen3datacommonsio.html
[Gen3 Data Hub]: https://gen3.datacommons.io/
[#3 .ipynb]: notebooks/notebook3_gen3datacommonsio.ipynb
[Gen3Submission Python SDK class]: https://uc-cdis.github.io/gen3sdk-python/_build/html/submission.html
