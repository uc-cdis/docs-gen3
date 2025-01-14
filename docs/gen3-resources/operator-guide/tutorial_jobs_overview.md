# Jobs in Gen3

A job is a finite unit of work that runs to completion (usually within a containerized environment). In Gen3, jobs are generally tasks that load, gather, or dump data. These might be background maintenance cronjobs set to run on a schedule (in our production data commons, an example is the usersync cronjob in Fence that runs to update policies based on the user.yaml), or jobs that are triggered as needed, perhaps manually by users (e.g., PFB creation) or in response to some event in the Gen3 instance (e.g., the ssjdispatcher indexing job when data files are uploaded).  

[Here is a list of existing Kubernetes jobs in Gen3](https://github.com/uc-cdis/cloud-automation/tree/master/kube/services/jobs); note that a few are designed for specific data commons and require a specialized Gen3 setup to work as expected. You can read more about [what each job does in this README](https://github.com/uc-cdis/cloud-automation/blob/master/kube/services/jobs/README.md) (it may be missing some more recently-created jobs).  

We have highlighted some specific jobs you will likely need early in your Gen3 development in this documentation.  

* [Fence Usersync CronJob](./tutorial_fence_usersync_job.md)
* [ETL job](./helm/helm-config/helm-config-data-svcs.md#how-to-configure-it_4) (described in the ETL configuration documentation)
* [Database Creation Job](./helm/helm-deploy-databases.md#automatic-database-creation-through-jobs) (described in the Databases in Gen3 Helm documentation)
