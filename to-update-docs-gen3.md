# Updating Gen3 documentation

If you would like to submit an update to the Gen3 documentation, we encourage you to create a PR with your change. However, **we request that you first test your changes before submitting them in a PR**. You can test your changes by forking the documentation repo and serving the documentation locally with Material for MkDocs, as described below. If testing is too technically challenging, we ask that you instead [create an issue](https://github.com/uc-cdis/docs-gen3/issues/new/choose) to suggest your update. 

## Steps to submit your own updates to Gen3 Documentation

### Install Material for MkDocs, and some support packages

Install Material for MkDocs - [installation instructions here](https://squidfunk.github.io/mkdocs-material/getting-started/). It is recommended that you install in a [virtual environment](https://realpython.com/what-is-pip/#using-pip-in-a-python-virtual-environment) that also has Python v3.11.5 or higher installed.  

The most recent version of Material for MkDocs should also install most of the extensions and plugins our documentation uses; however, you do need to additionally install [pymdown-extensions](https://pypi.org/project/pymdown-extensions/) and the [mkdocs-video plugin](https://pypi.org/project/mkdocs-video/). (A later section will show you [how to look if there are any additional dependencies](#check-if-there-are-additional-dependencies).)

### Fork the `docs-gen3` Github repo, then clone the fork locally

Since you will not have write privileges to the repo, you will need to fork the repo to create a branch and push your changes, then send the changes from your fork back to our repo in a PR.  

[Fork](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/fork-a-repo) the [docs-gen3 repository](https://github.com/uc-cdis/docs-gen3), then [clone your fork to create a local copy](https://docs.github.com/en/repositories/creating-and-managing-repositories/cloning-a-repository) on your computer and sync between the two locations.  

#### Check if there are additional dependencies

In your terminal, navigate to the directory with the local clone of your `docs-gen3` fork (for clarity, we will call this `your-forked-docs`). If you installed MkDocs in a virtual environment, activate it.  

Run `mkdocs get-deps` to summarize what dependencies are defined in the documentation's mkdocs.yaml. If it includes only `mkdocs`, `mkdocs-material`, `mkdocs-video`, and `pymdown-extensions`, you do not need to install any additional packages beyond what was [described above](#install-material-for-mkdocs-and-some-support-packages). If there are any additional dependencies, install them.  

### Locally serve the documentation using MkDocs

From the `your-forked-docs` directory in the terminal, run [`mkdocs serve`](https://www.mkdocs.org/user-guide/cli/#mkdocs-serve). By default, it will serve the Gen3 documentation to the localhost ([http://127.0.0.1:8000/](http://127.0.0.1:8000/)). If you are missing any dependencies, it will give you a warning in the terminal output.  

> *Note for users familiar with MkDocs: you will not need to use the `mkdocs build` commands, as the documentation is already built in the repo you cloned.*  

This will immediately reflect any saved changes to your local docs-gen3 fork, and so this is how you can examine whether your changes will have the expected result on the documentation. 

### Create a new branch in your local forked repo  

You can [configure Git to so that your local forked repo stays synced](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/fork-a-repo#configuring-git-to-sync-your-fork-with-the-upstream-repository) with any changes that happen in our `docs-gen3` repo.  

Otherwise, check whether your forked repo needs to be synced with the upstream repo. If so, [sync your fork](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/syncing-a-fork) with our docs repo, and then be sure to `checkout main` and `git pull` before making your changes to ensure you are editin the most up-to-date content.  

In the terminal, from the local `your-forked-docs` repo, [create a new branch](https://www.atlassian.com/git/tutorials/using-branches). Then, use the `git checkout`... command to check out your new branch.  

> Remember to follow Gen3's naming conventions for branches and commits as described in the [code contribution section of the docs](https://github.com/uc-cdis/docs-gen3/blob/main/docs/gen3-resources/developer-guide/contribute.md#naming-conventions).

### Make your changes locally

Now, make your desired changes to the files in the `your-forked-docs` repo. As you save the changes, they will immediately show up in the served documentation on localhost, so you can navigate to the pages with your changes and see how they look.  

Whenever possible, please avoid using HTML tags to achieve a formatting result. Although Markdown can be limiting in formatting, [we have implemented a number of Markdown extensions and MkDocs plugins](#markdown-extensions-and-mkdocs-plug-ins-available-in-our-documentation) that improve the ability to achieve the desired look.  

Here are some common mistakes with formatting in MkDocs:

* Beware that MkDocs uses a different flavor of Markdown than many other tools. (See more here: https://www.markdownguide.org/tools/mkdocs/). It’s especially finicky about indentations - improper indentation will break a list. For numbered lists, always check that multi-paragraph list items, or list items with code blocks (for example), is indented properly so that the list numbering does not restart after the additional block.  
* MkDocs-flavored markdown requires a line before and after elements like headings, code blocks, lists, and image references; otherwise, it will not render elements properly
* A single carriage return does not render as a line break. You need either two carriage returns or two spaces at the end of the line. For a list, there must be two spaces at the end of the line for the list to render as separate bulleted or numbered items.  

When you are done with your local testing - use CTRL+C to quit local serving, or just close the terminal window.

### Commit to your branch, and push changes to your remote fork

Use Git commands to add your changes to your local branch, commit them to the local repository, then push them to your forked repository. ([See here for more information about using Git for this](https://docs.github.com/en/get-started/using-git).)

Merge the changes into your forked repo. 

### Create a PR

[Create a PR](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request-from-a-fork) to send your changes to our `docs-gen3` repo. Consider selecting "Allow edits from maintainers" (see step 7 [in this link](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request-from-a-fork)).

Once you submit your PR, a member of the CTDS staff may request changes or ask you questions regarding your update.

## Markdown extensions and MkDocs plug-ins available in our documentation

Extensions enable you to use simple Markdown syntax to achieve some complex rendering. Here is a list of the available extensions and plug-ins:

markdown_extensions:
  - admonition
  - attr_list
  - md_in_html
  - def_list
  - footnotes
  - toc:
      permalink: True
      toc_depth: 3
  - pymdownx.superfences
  - pymdownx.details
  - pymdownx.caret
  - pymdownx.mark
  - pymdownx.tilde
  - pymdownx.tasklist:
      custom_checkbox: true  
  - pymdownx.smartsymbols
  - pymdownx.emoji:
      emoji_generator: !!python/name:pymdownx.emoji.to_svg
  - pymdownx.inlinehilite
  - pymdownx.magiclink
  - pymdownx.betterem:
      smart_enable: all
  - pymdownx.highlight:
      auto_title: true
plugins:
  - search
  - tags
  - blog:
      enabled: true
      authors: true
      authors_file: blog/authors.yml
      blog_dir: blog
      blog_toc: true
  - mkdocs-video:
      is_video: True