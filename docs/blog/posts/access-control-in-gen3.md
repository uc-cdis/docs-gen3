---
title: "How does Gen3 manage access control?"
slug: access-control-in-gen3
authors:
 - sara
date: 2026-05-04
categories:
  - How does Gen3...
  - From CTDS
tags:
  - Intro to Gen3
  - Authz
---

# How does Gen3 manage access control?

In Gen3, you have fine-grained control over access to data through: the user.yaml; Fence and Arborist; defining `program` and `project` resources; and setting `authz` and `tier_access_level`.  

It starts at the **user.yaml**, where you create roles and resources, and combine them to create policies that can be granted to a user for data access. **Fence and Arborist** then work together to compare the policies granted to the user with the requirements for accessing the data. Users with sufficient permissions to access or read the resource through which the data are presented will be allowed to access it.  

## Examples of how access can be controlled in Gen3

Some examples of what can be controlled-access (just a few of many):  

* Through the user.yaml and the frontend-framework authz.json config, you can lock down individual pages of the frontend so that users without permissions cannot even open them (and so cannot see any data on them).  
* Through the user.yaml, Indexd authz, and the Guppy config, you can make all data from a project (files, graph metadata, non-file graph data, ETL-transformed graph data/metadata) restricted from view or download.  
* Through the user.yaml and Guppy config, you can make some transformed aggregate data indices open-access while the individual record data in the files, graph, and other non-aggregate transformation indices are controlled access. You can make visualizations available for these open-access aggregate data indices.  
* Through the user.yaml and Indexd authz, you can make `project A` open access, while `project B` is controlled access. People with access to `project B` can see query results including both project records, while others will only see query results from `project A`.  

## Open-access data

You can make data open-access by setting assorted data permissions so that anyone can access your data (or some parts of them) even if they’re not authenticated (logged in).  

Some data are open-access by default in Gen3. This includes the data/metadata in MDS records, ETL-transformed MDS data (created through AggMDS), and the metadata in Indexd records. (Note: although the metadata in the Indexd records are open-access, the files described by the Indexd records are controlled-access by default through their `authz` values.)

Although most data in Gen3 are controlled-access by default, you can set data to be open-access.  

### Open to anonymous users

You can make data open to viewing by anyone who is not logged in (ie, anonymous or unauthenticated). This is defined by creating policies that grant read-access to the projects or other resources you want to make open-access, and adding that policy to the `anonymous_policies` field in the user yaml, as shown below:

```YAML
# user yaml config for making data open to anonymous users (ie, users who are not logged in)
authz:
  
  anonymous_policies: # policies automatically given to anyone, even if they are not authenticated
  - open_data_reader

  all_users_policies: []
  
  resources:
  - name: open
  - name: programs
      subresources:
        - <program name>
          subresources:
            - name: projects
              subresources:
                - name: <project name>
  
  roles:
  - id: guppy_reader
    description: grant read access through guppy to resource defined in policy
    permissions:
    - id: guppy_reader
      action:
        method: read
        service: guppy
  - id: fence_reader
    description: grant read access through fence to resource defined in policy
    permissions:
    - id: fence_reader
      action:
        method: read
        service: fence
  - id: peregrine_reader
    description: grant read access through peregrine to resource defined in policy
    permissions:
    - id: peregrine_reader
      action:
        method: read
        service: peregrine
  - id: sheepdog_reader
    description: grant read access through sheepdog to resource defined in policy
    permissions:
    - id: sheepdog_reader
      action:
        method: read
        service: sheepdog
  
  policies: # these combine roles with resources
  - id: open_data_reader
    description: Users with this policy have read access to /open resources through guppy, fence, peregrine, and sheepdog
    role_ids:
      - guppy_reader
      - fence_reader
      - peregrine_reader
      - sheepdog_reader
    resource_paths:
      - /open
      - /programs/<program name>/projects/<project you want to be open-access> # eg, /programs/OpenProgram/projects/OpenData
```

### Open to all authenticated users

You can also make data open to viewing by anyone who is logged in (ie, authenticated). Similar to how you grant access to anonymous users above, you first create policies that grant read-access to the projects or other resources you want to make open-access. But, instead of adding that policy to the `anonymous_policies` field in the user yaml, you add it to `all_users_policies`, as shown below:  

```YAML
authz:
  
  anonymous_policies: []

  all_users_policies: # policies automatically given to anyone who has logged in
  - open_data_reader

  #the rest of the config shown above (resources, roles, and policies) are the same as show above
```

## Controlled-access data

Most data are controlled-access by default in Gen3. This includes: graph data (submitted through Sheepdog); files; and ETL-transformed graph data (created through Tube). In fact, access to these data is so controlled that you must create the proper configuration for ANYONE to have access to them.  

### General configuration for controlled-access data

For most controlled-access data, the general steps for configuring access are the same:

1. Identify the **resource** that will control access to the data. This is most commonly the project name, but can be distinct resources for some types of data.  
2. Specify the **resource in the user.yaml**. If it is a project, the resource will have the form `/programs/<program name>/projects/<project name>`. Otherwise, it will have the form `/<resource name>`.  
3. In the user.yaml, **create a policy** that grant users `access` or `read`-access to the resource.  
4. In the user.yaml, **grant the policy** to appropriate users (and wait for usersync to run).  

Below, we describe how access is controlled for: graph data (and transformed graph data); file data; and (coming soon) MDS data (and transformed MDS data).  

### Controlling access to graph (Sheepdog) data

Access to **graph data** (whether graph metadata or non-file data in the graph) **is controlled at the level of project**. (Tip: If you have different consent groups that require different policies for access, you should make them different projects to control access independently). You can set a project to be open-access ([as described above](#open-access-data)) or controlled-access in the user.yaml.

To create access to a project's graph data, add the project (and the program, if it is not already listed as a resource) to the list of resources. An example for how to add a program and project to the resources list is provided in the [open-access data user.yaml config shown above](#open-to-all-authenticated-users).

Then, create a policy that provides read-access to the project resource. An example for creating this policy is also shown in the [open-access data user.yaml config shown above](#open-to-all-authenticated-users).  

The way this becomes controlled-access instead of open-access as shown in the previous example is that the policy is not added to either `anonymous_policies` nor `all_users_policies`. Instead, you create a group with this policy (and perhaps other policies, if you want), and add appropriate users to the group. For example:  

```YAML
# user yaml config for making a group that grants access to a controlled-access project
authz:
  
  anonymous_policies: []

  all_users_policies: []

  groups:
  - name: ProjA_access
    policies:
    - ProjA_data_reader
    users:
    - <username>

  policies: # these combine roles with resources
  - id: ProjA_data_reader
    description: Users with this policy have read access to ProjA through guppy, fence, peregrine, and sheepdog
    role_ids:
      - guppy_reader
      - fence_reader
      - peregrine_reader
      - sheepdog_reader
    resource_paths:
      - /programs/<program name>/projects/ProjA
  
# the necessary roles for guppy/fence/peregrine/sheepdog_reader are the same as for open-access
# the ProjA resource is structured similarly as in open access, although this specific policy is looking for a project called ProjA
  
  users:
    <username>: {}
```

Output from querying the graph database (eg, querying the graph model through the Query page or querying through the Gen3 SDK Submission class) is governed by whether you have a policy that grants you read permissions for a controlled project.


### Controlling access to ETL-transformed graph data (created by Tube from the Sheepdog database)

ETL-transformed graph data indices have more flexibility for control. By default, access is controlled at the level of project, like the graph data.  

However, ETL-transformed graph data indices can be set to have the following access controls using the `tier_access_level` in the global config ([you can see the Guppy documentation about this here](https://github.com/uc-cdis/guppy/tree/master#tiered-access)):  

* **Control access based on project**, matching the access level of the graph data. This can be set with **`tier_access_level: private`**. This is the default configuration.  
* **Control access to data in collector-type indices** based on project, but permit **open access to data in aggregator-type indices**. This can be set with **`tier_access_level: regular`** and uses a minimum threshold of records present in the query output (as defined by you with the `tier_access_limit` property). If the number of records meets or exceeds the `tier_access_limit` value, the results will be returned even if the user does not have a policy that grants access to the project. However, if the query results in fewer records than the defined limit, it will instead return a message that there are too few records.  
* **Open access**, even if the graph data is controlled-access. This can be set with **`tier_access_level: libre`**. You might want to do this if the transformation provides further anonymization to the data.  

In addition to using the site-wide global `tier_access_limit` property as described above, Gen3 users also have the **option to set `tier_access_limit` individually for each index**. [This is described in the Guppy documentation](https://github.com/uc-cdis/guppy/blob/master/doc/index_scoped_tiered_access.md).  

### Controlling access to file data

Files can have more granular access control than graph data. Permission to download a file is governed by the `authz` defined for the file in the Indexd record. If a user has been granted access to the resource in the `authz` field, they can download the file.  

Typically, operators will set the authz to use the project as the resource. But, if you want to set more granular access on, for example, raw data files vs processed data files vs summary data files where all the files are from the same project, you can:

1. Create resources specific to these groups  
2. Generate a policy in the user.yaml that grants download access to each of the new resources  
3. Grant those policies to users to permit download access to the files  

The user.yaml configuration below creates the necessary configuration to download either:

* files with Indexd `authz: /open` (this is governed by the `open_data_reader` policy, which now has the `fence_storage_reader` role)
* files with Indexd `authz: /programs/Program1/projects/ProjA_raw_files` (this is governed by the `ProjA_raw_downloader` policy)

```YAML
# user yaml config for allowing file download for authz: /open and authz: /programs/Program1/projects/ProjA_raw_files
authz:
  
  anonymous_policies: []

  all_users_policies: # policies automatically given to anyone who has logged in
  - open_data_reader
  
  groups:
  - name: ProjA_raw_access
    policies:
    - ProjA_raw_downloader
    users:
    - <username>

  resources:
  - name: open
  - name: programs
    subresources:
      - name: Program1
        subresources:
          - name: projects
            subresources:
              - name: ProjA
              - name: ProjA_raw_files
              - name: ProjA_processed_files
              - name: ProjA_immune_files
  
  roles:
  - id: fence_storage_reader
    description: read/download access across storage-backed services
    permissions:
    - id: fence_storage_reader
      action:
        method: storage
        service: fence
  # also include roles for guppy_reader, fence_reader, peregrine_reader, and sheepdog_reader as used previously
  
  policies: 
  
  - id: ProjA_raw_downloader
    description: Users with this policy can download files with authz /programs/Program1/projects/ProjA_raw_files
    role_ids:
      - storage_reader 
    resource_paths:
      - /programs/Program1/projects/ProjA_raw_files

  - id: open_data_reader
    description: Users with this policy have read/download access to /open resources through guppy, fence, peregrine, and sheepdog
    role_ids:
      - fence_storage_reader
      - guppy_reader
      - fence_reader
      - peregrine_reader
      - sheepdog_reader
    resource_paths:
      - /open

  users:
    <username>: {}
```

### Controlling access to metadata-service (MDS) data and ETL-transformed MDS data

Although data in the metadata-service (MDS) is open by default, the Gen3 product team is currently developing an option to control access to MDS data through `authz`. Although this is not quite available yet - watch the Gen3 release notes for this new feature for optional controlled-access through `authz` implemented for MDS data/metadata and ETL-transformed MDS data/metadata.  

### Controlling access by protecting frontend pages from access

In the new Frontend-Framework service, each page can be optionally protected enforce authorization through policy. By default, all pages are unprotected (viewable by anonymous users) except Profile, Data Library, and Workspaces, which require the user to be logged in.  

You can see information about how to set up page protection in the [Frontend-Framework service documentation](https://github.com/uc-cdis/gen3-frontend-framework/blob/develop/docs/Configuration/ProtectingPages.md). It requires both configuration in the user.yaml and configuration through the authz.json in the frontend framework.  


## Related: Requestor service can streamline granting/revoking access policies

Gen3 also has a service, [Requestor, that allows users to request access to resources](https://github.com/uc-cdis/requestor) and allows operators to grant access in a programmatic, auditable manner that maintains logs of requests and approvals. It bypasses the need to add users to the user.yaml and grants (and can also remove) policies directly to a user in the platform. You can use Requestor to manage access for anything that can be defined as a resource.  

*Did you enjoy this post? You can find other posts in the How does Gen3 series at [https://docs.gen3.org/blog/category/how-does-gen3/](https://docs.gen3.org/blog/category/how-does-gen3/).*
