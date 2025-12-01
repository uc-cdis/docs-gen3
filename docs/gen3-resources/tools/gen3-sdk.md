

# Using the Gen3 Python SDK
To make programmatic interaction with Gen3 data commons easier, the bioinformatics team at the Center for Translational Data Science (CTDS) at University of Chicago has developed the Gen3 Python SDK, which is a Python library containing functions for sending standard requests to the Gen3 APIs. The code is open-source and available on [GitHub][Gen3 Python SDK Github] along with [documentation for using it][Gen3 Python SDK doc].

The SDK includes the following classes of functions:

1. *Gen3Auth*, which contains an authorization wrapper to support JWT-based authentication,
2. *Gen3Submission*, which interacts with the Gen3’s submission service including GraphQL queries,
3. *Gen3Index*, which interacts with the Gen3’s Indexd service for GUID brokering and resolution.

Below is a selection of commonly used functions along with [notebooks demonstrating their use][Jupyter demos].

## Getting Started

The Gen3 SDK can be installed using “pip”, the package installer for Python. For installation details, see [this documentation][Gen3 Python SDK install].

```
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

1) Most requests sent to a Gen3 data commons API will require an authorization token to be sent in the request’s header. The SDK class *Gen3Auth* is used for authentication purposes, and has functions for generating these access tokens. Users do need to authenticate when using the SDK from the terminal, but do not need to authenticate once being logged in and working in the workspace of a Data Commons.

From the python shell run the following:

```
import gen3
from gen3.auth import Gen3Auth
endpoint = "https://gen3.datacommons.io/"
creds = "/user/directory/credentials.json"
auth = Gen3Auth(endpoint, creds)
```

2) The [Gen3Submission][Gen3Submission Python SDK class] class of the Python SDK has functions for sending queries to the API and also for retrieving the graphQL schema of the data commons. Queries can be used to pinpoint specific data of interest by providing query arguments that act as filters on records in the database and providing lists of properties to retrieve for those records. If all the structured data in a record or node is desired, as opposed to only specific properties, then see the export functions below.

Entire structured data records can be exported as a JSON or TSV file using the Gen3Submission Python SDK class. The export_record function will export a single structured metadata record in a specific node of a specific project, whereas the export_node function will export all the structured metadata records in a specified node of a specific project.

2.1) All available programs in the data commons will be shown with the function `get_programs`. The following commands:

```
import gen3
from gen3.submission import Gen3Submission
sub = Gen3Submission(endpoint, auth)
sub.get_programs()
```
will return: `{'links': ['/v0/submission/OpenNeuro', '/v0/submission/GEO', '/v0/submission/OpenAccess', '/v0/submission/DEV']}`

2.2) All projects under a particular program (“OpenAccess”) will be shown with the function `get_projects`. The following commands:

```
from gen3.submission import Gen3Submission
sub = Gen3Submission(endpoint, auth)
sub.get_projects("OpenAccess")
```

will return “CCLE” as the project under the program “OpenAccess”: `{'links': ['/v0/submission/OpenAccess/CCLE']}`

2.3) All structured metadata stored under one node of a project can be exported as a tsv file with the function `export_node`. The following commands:
```
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

3) The function `get_record` in the class *Gen3Index* is used to show all metadata associated with a given id by interacting with Gen3’s Indexd service. GUIDs can be found on the [Exploration page][Exploration page] under the `Files` tab. The following commands:

```
from gen3.index import Gen3Index
ind = Gen3Index(endpoint, auth)
record1 = ind.get_record("92183610-735e-4e43-afd6-7b15c91f6d10")
print(record1)
```

will return: `{'acl': ['*'], 'authz': ['/programs/OpenAccess/projects/CCLE'], 'baseid': 'e9bd6198-300c-40c8-97a1-82dfea8494e4', 'created_date': '2020-03-13T16:08:53.743421', 'did': '92183610-735e-4e43-afd6-7b15c91f6d10', 'file_name': None, 'form': 'object', 'hashes': {'md5': 'cbccc3cd451e09cf7f7a89a7387b716b'}, 'metadata': {}, 'rev': '13077495', 'size': 15411918474, 'updated_date': '2020-03-13T16:08:53.743427', 'uploader': None, 'urls': ['https://api.gdc.cancer.gov/data/30dc47eb-aa58-4ff7-bc96-42a57512ba97'], 'urls_metadata': {'https://api.gdc.cancer.gov/data/30dc47eb-aa58-4ff7-bc96-42a57512ba97': {}}, 'version': None}`

## Jupyter Notebook Demos
Below are three tutorial Jupyter Notebooks that demonstrate various SDK functions that may be helpful for the analysis of data in a Gen3 workspace. You can also navigate to the notebook browser of [Gen3 Data Hub][Data Hub notebooks] or the [Biomedical Research Hub][BRH notebooks]to explore the notebooks.

1. Find this notebook [“Gen3_authentication notebook”][#1 Gen3_auth notebook] to help guide you how to authenticate from the terminal or from the workspace (download also as [.ipynb][#1 .ipynb] file). Note that users do need to authenticate when using the SDK from the terminal, but do not need to authenticate once being logged in and working in the workspace of a Data Commons.

2. Download node files, show/select data, and plot with this [notebook][#2 notebook canine] using data hosted on the [Canine Data Commons][Canine Data Commons]. Users can upload this notebook as an [.ipynb][#2 .ipynb] file to the workspace of the Canine Data Commons to start their analysis. Note, that bringing in files into the workspace as explained in this notebook can be also achieved on selected Data Commons by clicking the “Export to Workspace” button on the Exploration Page; please also note, that once files are exported from the Exploration page, users do not need to authenticate anymore in the workspace.

3. Download data files and metadata using the gen3-client and the Gen3 SDK, respectively, and bring them into the workspace. Run gene expression analysis and statistical analysis on the data files and metadata, respectively, and plot the outcome in different scenarios. This Jupyter [Data Analysis Notebook][#3 notebook] uses data hosted on the [Gen3 Data Hub][Gen3 Data Hub]. Upload this notebook as an [.ipynb][#3 .ipynb] file to the workspace of the Gen3 Data Hub and start your analysis. Note, that bringing in files into the workspace as explained in this notebook can be also achieved on selected Data Commons by clicking the “Export to Workspace” button on the Exploration Page; please also note, that once files are exported from the Exploration page, users do not need to authenticate anymore in the workspace.

When finished, please, shut down the workspace server by clicking the “Terminate Workspace” button.


<!-- Using the Gen3 Python SDK -->
[Gen3 Python SDK Github]: https://github.com/uc-cdis/gen3sdk-python
[Gen3 Python SDK doc]: https://uc-cdis.github.io/gen3sdk-python/_build/html/index.html
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
