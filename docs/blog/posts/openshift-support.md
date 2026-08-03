---
draft: true
authors:
  - qureshi
date: 2026-08-03
slug: openshift
categories:
  - For Gen3 Operators
  - From CTDS
tags:
  - Openshift
  - Kubernetes
  - Kubernetes Management
  - Containerization
  - Kubernetes Alternatives
  - Kubernetes Learning
  - Kubernetes Testing
  - Resource Optimization

---

# Gen3 now offers the option to use OpenShift instead of plain Kubernetes

We are excited to share that Gen3 now supports running Gen3 Helm charts on Red Hat's [OpenShift distribution of Kubernetes](https://www.redhat.com/en/technologies/cloud-computing/openshift)! Although the default for Gen3 Helm is to run on plain Kubernetes, Gen3 users who prefer the user-friendliness and robust built-in security tools offered through Openshift can now implement Gen3 with OpenShift.  

If you are interested in deploying Gen3 with OpenShift, read on for important information about what changed and what defaults to manage when using OpenShift.  

If you prefer to continue to use plain Kubernetes, all the Gen3 Helm defaults will continue to support that; you will not need to make any changes.  

## Making the Gen3 Helm chart run on OpenShift

Gen3's Helm chart was written for plain Kubernetes with an Ingress in front of it. OpenShift is Kubernetes, but its default security posture rejects a lot of what a normal Helm chart assumes:  

* Containers can't bind to ports below 1024  
* Containers can't run as a fixed UID unless you're specifically granted that  
* The root filesystem is expected to be read-only unless you explicitly declared otherwise  

[Gen3 Helm PR #552](https://github.com/uc-cdis/gen3-helm/pull/552), merged June 2026, is the actual body of work that permits the Gen3 Helm chart to run under those constraints. We touched nearly every subchart in this effort, but mostly to just apply the same handful of patterns everywhere.  

This post walks through what that PR actually changed and why, and then reports what we observed when testing a fresh deployment end-to-end (i.e., from login to a real data submission via `gen3-sdk`).

## The core problem: In OpenShift, the containers can't do what they used to in plain Kubernetes

Two OpenShift defaults matter here, and almost everything in the PR is a consequence of one or the other:

* **Restricted Security Context Constraint (SCC) assigns an arbitrary non-root UID per namespace** and won't let a container bind privileged ports (<1024) unless it is root. Every Gen3 service was written assuming it could listen on port 80, so that needed to change for OpenShift compatibility.  
* **`readOnlyRootFilesystem` is often enforced**, which breaks anything that writes to paths baked into the image — for example, nginx's pid file, its temp/ cache dirs, its logs.  

Fix both, and most of the rest is bookkeeping.

## Fix #1: stop hardcoding port 80

Every subchart's `deployment.yaml` had `containerPort: 80` baked into the template, and the app itself was told (via CLI flag or env var, depending on the service) to listen on 80. The PR made the port a value instead, and added an explicit non-privileged default:  

```diff
 # helm/arborist/templates/deployment.yaml
           ports:
             - name: http
-              containerPort: 80
+              containerPort: {{ .Values.service.targetPort }}
               protocol: TCP
   ...
-              /go/src/github.com/uc-cdis/arborist/bin/arborist
+              /go/src/github.com/uc-cdis/arborist/bin/arborist --port {{ .Values.service.targetPort }}
```

```diff
 # helm/arborist/values.yaml
 service:
   type: ClusterIP
   port: 80
+  targetPort: 8080
```

The same shape landed in `fence`, `sheepdog`, `indexd`, `peregrine`, `portal`, `revproxy`, `guppy`, `hatchery`, `metadata`, `manifestservice`, `requestor`, `sower`, `ssjdispatcher`, `wts`, `cedar`, `audit`, `argo-wrapper`, `gen3-workflow`, `gen3-analysis`, `gen3-user-data-library`, `cohort-middleware`, `access-backend`, `dicom-server`, `ohif-viewer`, `ohdsi-atlas`, `ohdsi-webapi`, `orthanc` — over 25 subcharts got a `service.targetPort` value and the corresponding template change.  

> `service.port` (what other pods see when they talk to the Service) stays at the conventional `80`; `targetPort` (what the container itself actually binds) moves to something in the 8000s that any UID can bind.  

The probes had to move with it — `httpGet.port: 80` became `httpGet.port: http`, referencing the named port instead of a number, so a probe doesn't silently point at the wrong port if `targetPort` changes:  

```diff
           livenessProbe:
             httpGet:
               path: /_status?timeout=20
-              port: 80
+              port: http
```

## Fix #2: give nginx somewhere to write

`revproxy` and `portal` both run nginx, and nginx by default wants to: 

* write a pid file to `/var/run`, bind port 80,  
* resolve upstream service names via `kube-dns.kube-system.svc.cluster.local` (an in-cluster DNS name that doesn't exist the same way on every OpenShift cluster), and  
* write its temp/cache/log directories into paths baked into the image.  

Every one of those breaks under a restricted, read-only-root SCC. The fix templates all of it:  

```diff
 # helm/revproxy/nginx/nginx.conf
-user nginx;
+user {{ .Values.nginx.user }};
 worker_processes 4;
-pid /var/run/nginx.pid;
+pid {{ .Values.nginx.pidFile }};
 ...
+  client_body_temp_path /tmp/client_temp;
+  proxy_temp_path       /tmp/proxy_temp_path;
+  fastcgi_temp_path     /tmp/fastcgi_temp;
+  uwsgi_temp_path       /tmp/uwsgi_temp;
+  scgi_temp_path        /tmp/scgi_temp;
   ...
   server {
-    listen 80;
+    listen {{ .Values.service.targetPort }};
   ...
-    resolver kube-dns.kube-system.svc.cluster.local ipv6=off;
+    resolver {{ .Values.nginx.resolver }} ipv6=off;
```

and the deployment gets `emptyDir` volumes mounted over every path nginx
needs to write to, since the rest of the image filesystem is read-only:  

```diff
 # helm/revproxy/templates/deployment.yaml
       volumes:
+        - name: nginx-tmp
+          emptyDir: {}
+        - name: nginx-cache
+          emptyDir: {}
+        - emptyDir: {}
+          name: nginx-logs
   ...
           volumeMounts:
+          - mountPath: /var/log/nginx
+            name: nginx-logs
   ...
+          - name: nginx-tmp
+            mountPath: /tmp
+          - name: nginx-cache
+            mountPath: /var/cache/nginx
```

`portal` got equivalent treatment — its own `nginx-tmp` emptyDir, a
`portal-nginx` ConfigMap mounted over `/etc/nginx/nginx.conf` and
`/etc/nginx/conf.d/nginx.conf`, and explicit pod/container
`securityContext` blocks wired into the template rather than left to
inherit whatever the cluster defaulted to:  

```diff
 # helm/portal/templates/deployment.yaml
       serviceAccountName: {{ include "portal.serviceAccountName" . }}
+      securityContext:
+        {{- toYaml .Values.podSecurityContext | nindent 8 }}
   ...
         - name: portal
           image: "{{ .Values.image.repository }}:{{ .Values.image.tag | default .Chart.AppVersion }}"
+          securityContext:
+            {{- toYaml .Values.securityContext | nindent 12 }}
```

The chart ships two variants of the portal/frontend-framework nginx config — `gen3.nginx.conf/portal-as-root/` and `.../gen3ff-as-root/` — so the right one gets mounted depending on which frontend (`global.frontendRoot: portal` or `gen3ff`) is actually enabled.  

## Fix #3: stop assuming a specific UID/GID

`fence` had `podSecurityContext.fsGroup: 101` hardcoded — which was fine on whatever cluster that number meant something on, but meaningless (or actively wrong) on an OpenShift namespace with its own assigned UID/GID range. The PR just removes the assumption:  

```diff
 # helm/fence/values.yaml
 podSecurityContext:
-  fsGroup: 101
+podSecurityContext: {}
```

and `sheepdog` (which previously had no `securityContext`/ `podSecurityContext` knobs at all) got them added, template and values both. However, these are commented-out by default so an operator explicitly opts-in rather than the chart making a decision for them:  

```yaml
# helm/sheepdog/values.yaml
podSecurityContext:
  {}
  # fsGroup: 2000

securityContext:
  {}
  # capabilities:
  #   drop:
  #   - ALL
  # readOnlyRootFilesystem: true
  # runAsNonRoot: true
  # runAsUser: 1000
```

This is the pattern `examples/openshift_values.yaml` leans on: pick a fixed `runAsUser`/`fsGroup` per service and set it explicitly, once you know what your namespace's SCC actually allows. *(See the [SCC section below](#SCC) — it's not always the plain-vanilla `restricted-v2` you'd expect)*.  

## Fix #4: add an actual OpenShift Route

None of the above matters if there's no way to get external traffic in without an Ingress controller. `revproxy` gained a real `Route` template:  

```yaml
# helm/revproxy/values.yaml
openshiftRoute:
  enabled: false
  annotations: {}
  host: ""
  path: "/"
  targetPort: "http"
  tls:
    termination: "edge"
    insecureEdgeTerminationPolicy: "Redirect"
  wildcardPolicy: "None"
```

rendering a plain `route.openshift.io/v1` object gated behind `openshiftRoute.enabled`, so it's opt-in and coexists with the chart's existing Ingress templates rather than replacing them.  

## Fix #5: `kubectl` isn't always the right tool

`wts`'s OIDC-client-registration job uses `kubectl patch` to patch a Kubernetes Secret with the
client ID/secret it gets back from fence. That's fine on plain Kubernetes; however, on some OpenShift setups, the permissions model around who can patch what differs enough that it's simpler to swap in the OpenShift CLI image and use `oc` instead — gated behind a flag so it's opt-in per deployment:  

```yaml
# helm/wts/values.yaml
oidc_job_openshift: true
```

```yaml
# helm/wts/templates/wts-oidc.yaml
{{- if .Values.oidc_job_openshift }}
- name: oc
  image: image-registry.openshift-image-registry.svc:5000/openshift/cli:latest
  ...
  oc patch secret wts-oidc-client --type=merge -p "..."
{{- else }}
- name: kubectl
  image: {{ .Values.image.utilImage }}
  ...
{{- end }}
```

## Fix #6: a `gen3_load` dependency that didn't need to be there

The shared `_db_setup_job.tpl` that is used by every service's `dbcreate` init job sourced a `gen3/gen3setup` helper via `gen3_load` before running its Postgres-readiness loop. The PR comments that out in favor of plain `echo`/shell — one less external dependency for a job that's really just "wait for Postgres, create the DB if it doesn't exist, patch a Secret so
downstream pods know it's done." (Commit messages in the PR describe this alongside "postgresql 15+ support" and cronjob fixes for `metadata` and `fence` — the common thread across all of them is removing assumptions that didn't hold up outside the original target environment.)  

## What we validated by actually deploying it

Reading a diff tells you what changed; it doesn't tell you whether the result actually works end-to-end. We took a Gen3 values file built on top of this PR's changes [(`examples/openshift_values.yaml`)](https://github.com/uc-cdis/gen3-helm/blob/master/examples/openshift_values.yaml), did a clean `helm uninstall` / `helm install` cycle against a real OpenShift namespace, and tested Gen3 behavior through login and data submission. Four things surfaced that the PR's diff alone wouldn't show you:  

**`global.hostname` must match your Route host, exactly.** The PR gives you `openshiftRoute.host` to set the Route's hostname, but fence's `BASE_URL` (which drives every OAuth/OIDC redirect, `OAUTH2_JWT_ISS`, and the CSP `FRAME_ANCESTORS` header) is built from a [separate value, `global.hostname`](https://github.com/uc-cdis/gen3-helm/blob/fe42678b27684ebbed7b60665e8ce45871b826f4/helm/gen3/values.yaml#L83). If you only set `openshiftRoute.host` and leave `global.hostname` as the chart default (`localhost`), the portal loads fine, but clicking "Login" will redirect to `https://localhost/...`. Not a bug in the PR — just a second value that needs to agree with the first one (easy to miss).

**Namespace `LimitRange`s can undo the port/UID work in a different way.** Plenty of OpenShift projects cap containers at a default CPU *limit* (commonly `200m`) if no limit is set explicitly. We hit this twice:  

* `postgresql`'s upstream chart requests `250m` CPU with no explicit limit, which OpenShift outright rejects (`FailedCreate`, pod never even schedules) once the LimitRange injects its `200m` default.  
* `fence` had no `resources` block in our values file at all, silently inherited the same `200m` limit from OpenShift `LimitRange`, and got CPU-throttled under real login traffic — resulting in 8-24 second responses on `/user/user`. No errors anywhere -- just slow.  

The solution is to use `kubectl get limitrange -o yaml` before you deploy, and give explicit `resources` to whatever is on your request hot path.  

<a id="SCC"></a>**Check which SCC policies you actually have before assuming you need more.** The namespace we deployed into surprisingly carried `restricted-v2-anyuid`, not plain `restricted-v2` — an `anyuid`-flavored grant that permits fixed `runAsUser` values outside the namespace's assigned UID range. That's why the fixed UIDs in `examples/openshift_values.yaml` (`1000`, `1000660001`, `1000950000`) work at all. (If our namespace only had the `restricted-v2` SCC, we would only have been able to use values in the assigned UID range.) To check what SCC policies are already granted, you can use `kubectl get pod <pod> -o jsonpath='{.metadata.annotations.openshift\.io/scc}'`. This can help you avoid an assumption that your cluster needs a specific SCC grant it might already have.  

**`gen3-sdk` requires validation of the server's certificate to connect to the server.** If your Route host isn't under the cluster's actual router wildcard domain (our example was chosen to match a local `/etc/hosts` entry, not the cluster's real domain), the router's TLS cert won't validate. If using cURL to test connection, `curl -k` will permit connecting while skipping the security check. However, the Gen3 SDK classes `Gen3Auth`/`Gen3Submission` use plain `requests` with no verification override exposed. We could not use the Gen3 SDK to submit data in our disposable insecure dev cluster unless we globally disabled `requests` verification for the session. Of course, for anything closer to production, put the Route under the real router domain instead.  

With those four addressed, the full path worked: Route → mock Google login → `fence-create token-create` for a scripted API key → `gen3-sdk` creating a Program, a Project, and an Experiment node under it, verified by reading the record back through peregrine's GraphQL endpoint. The [`openshift.md` file in the Gen3 Helm repo](https://github.com/uc-cdis/gen3-helm/blob/fix/openshift-login-and-docs/docs/openshift.md) has the exact commands for reproducing all of this, including the mock-auth/API-key/submission flow in full.  

## Where things stand

The chart-level work ([PR #552](https://github.com/uc-cdis/gen3-helm/pull/552)) is the real substance here: over two dozen subcharts updated with a consistent, minimal pattern — parameterize the port, give nginx somewhere to write, stop hardcoding UIDs, add a Route. None of it is exotic; all of it is the specific set of assumptions that plain-Kubernetes Helm charts tend to make without realizing they're assumptions until OpenShift's defaults refuse to go along with them. What we added on top is smaller: a working reference values file, and the handful of environment-specific "gotchas" (hostname/BASE_URL agreement, LimitRange interactions, SCC variants, TLS verification) that only show up once you actually deploy and click through the thing.  
