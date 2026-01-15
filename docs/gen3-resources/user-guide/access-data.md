# Access Data Files

## Authentication and Authorization

### Authentication
Authentication refers to how a user identifies themselves to the Gen3 system.  The method of user authentication varies from system to system.  This could include eRA Commons, Google, Microsoft Office 365, InCommons, eduGAIN, ORCID, or generally anything following an OIDC standard.  This is configured by your system operator, and you can find more details in the [Gen3 Operator's Guide][configure auth].


### Authorization
Authorization indicates to which data a particular user has access.  Governance practices vary from Gen3 system to system and this can take a variety of forms, but typically falls into two buckets: allow list and dbGaP.   You can find more in-depth details on how this is configured within the [Gen3 Operator's Guide][configure auth].

#### Allow list
An allow list is simply a list of users (identified based on your method of authentication) that controls which users have access to which data.  It is in the form of a user.yaml file that is maintained by the operator of your Gen3 system.  You should contact the operator of your system or follow whatever process they have in place to request access.  Gaining access may require you to sign a Data Use Agreement.  Data access is granted at the program or project level.

#### dbGaP
Another common authorization mechanism is dbGaP.  In order to obtain access to controlled-access data via dbGaP, PIs must first obtain an [NIH eRA Commons account][era_commons] and then obtain authorization to access the data through the [NIH database of Genotypes and Phenotypes (dbGaP)][dbgap].

To obtain dbGaP access, navigate to the [dbGaP Authorized Access site][dbgap auth] and follow the instructions. This process includes working with your institutional research office, reviewing the consent agreement for the particular project, and writing a Research Use Statement and thus can take a significant amount of time.

#### Bulk allow list
Another option is to use a bulk allow list from an SFTP server in the same format as dbGaP, but not actually controlled by dbGaP.

#### Requestor Service
Operators can also take advantage of the Requestor Service for dynamic authorization. In this case Gen3 interacts with another system where authorization requests are reviewed, approved, denied, or revoked.


## Download Files Using the Gen3-client
The gen3-client provides an easy-to-use, command-line interface for uploading and downloading data files to and from a Gen3 data commons from the terminal or command prompt, respectively.  In some systems "download" may be restricted to only within a Gen3 Workspace.  

You can find details for installation and usage for the gen3-client [here][Gen3 Client]

Note that Gen3 also comes with an SDK tool that can perform many of the same functions as the client for downloading along with many other features not found in the client.  You can read more about the Python SDK tool [here][SDK Tool].



<!-- AuthN/Z -->

[configure auth]: ../operator-guide/gen3-authn-methods.md
[era_commons]: https://public.era.nih.gov/commonsplus/public/login.era
[dbgap]: https://www.ncbi.nlm.nih.gov/gap/
[dbgap auth]: https://dbgap.ncbi.nlm.nih.gov/aa/wga.cgi?page=login

<!--Gen3 client -->
[Gen3 Client]: ../tools/data-client.md
[SDK Tool]: ../tools/gen3-sdk.md
