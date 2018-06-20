# Jira Lead Times

* [Taking the script into use](#taking-the-script-into-use)  
  * [0: Download Node.js](#0-download-nodejs)
  * [1: Download the script](#1-download-the-script)
  * [2: Installation](#2-installation)
  * [3: Run the script](#3-run-the-script)
* [Configuration](#configuration)
  * [config.jira.json](#configjirajson)
  * [config.project.*.json](#configprojectjson)
  * [Status JSON Structure](#status-json-structure)
  * [Script Configurations](#script-configurations)
    * [Donetickets](#donetickets)
    * [Leadtime](#leadtime)
    * [Storypoints](#storypoints)
* [Script Descriptions](#script-descriptions)
  * [Donetickets](#donetickets-1)
  * [Leadtime](#leadtime-1)
  * [Storypoints](#storypoints-1)

This script scrapes the Lindorff JIRA to get times on how long a ticket has been in any particular status.

**Note:** There's quite a few of shortcuts made when developing this. If (when) you encounter something weird, just [file an issue in GitHub](https://github.com/lindorff/JiraLead/issues/new) or tell [Henrik Paul](mailto:henrik.paul@lindorff.com) directly.

## Taking the script into use

### 0: Download Node.js

This script needs [Node.js](https://nodejs.org/) to be installed on your computer. I recommend [the "Current" version](https://nodejs.org/en/download/current/).

You can check if you have it installed by opening the command prompt (press <kbd>Win</kbd>+<kbd>R</kbd> and run "cmd") and then check the `npm` command:

    $> npm --version
    4.2.0

The exact version does not matter, as long as it's 4.2.0 or greater.

### 1: Download the script

Download [the latest ZIP file](https://github.com/lindorff/JiraLead/archive/master.zip) from [GitHub](https://github.com/lindorff/JiraLead), and unpack it somewhere you remember (such as `c:\jiralead\`)

### 2: Installation

Before running this for the first time, run this command in the script's directory, to download all kinds of stuff

    $> npm install

Check the `config.*.json` files in the directory for all configurations needed.

### 3: Run the script

To run the script, just use the `run` script and follow the instructions!

    $> run    # on windows
    $> ./run  # on UNIX

## Configuration

### config.jira.json

This file contains all of the information that will be used to connect to your JIRA server.

| Config | Desc                                    |
| ------ | --------------------------------------- |
| `user` | The user to use when querying Jira.     |
| `pass` | The password to use when querying Jira. |
| `url`  | The http/https address to Jira.         |

### config.project.*.json

You need to create one of these files per JIRA project and/or workflow you're interested in. You will then use it when running the script; e.g. if you have a file called `config.project.myproject.json`, then you would use that configuration by running the script with

    $> run --project myproject <script>

| Config     | Desc                                                                    |
| ---------- | ----------------------------------------------------------------------- |
| `statuses` | A list of [statuses](#status-json-structure) that you are interested in |
| `project`  | The Jira project name (for a ticket like `ABC-1`, this is `ABC`)        |
| `scripts`  | Configuration for various scripts.                                      |

### Status JSON Structure

The `statuses` configuration is an array of two things: Either a `string` that is the name of the status, or an `object` with the following structure:

| Key      | Type      | Desc                                                                                               |
| -------- | --------- | -------------------------------------------------------------------------------------------------- |
| `name`   | `string`  | The name of the status                                                                             |
| `isDone` | `boolean` | (**optional**, default `false`) Whether this status should be considered as the issue being "done" |

Each `string` in the `statuses` configuration array is considered as being a "not-done" status.

### Script Configurations

There are currently three supported scripts. Each have their own configuration section.

#### Donetickets

Currently no separate configuration, so the configuration object is left empty ("`{}`")

#### Leadtime

| Config        | Desc                                                                                                                       |
| ------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `showSummary` | (**optional**, default `false`) Setting to "true" will get you the summary text of the ticket into the result set as well. |

#### Storypoints

| Config                 | Desc                                                                                                       |
| ---------------------- | ---------------------------------------------------------------------------------------------------------- |
| `propertyName.jqlName` | The name of the field, as you would search for them with JQL                                               |
| `propertyName.apiName` | The name of the field as it is returned via the REST API                                                   |
| `types`                | The types of issues that you are interested in                                                             |
| `ignoreStatuses`       | Which statuses not to count towards the in-progress time                                                   |
| `output`               | The file where to write the resulting CSV. This can be overridden with a `--output` command-line parameter |

## Script Descriptions

The description for each script is below:

### Donetickets

With `donetickets` you are able to see which issues actually have become done, and stayed done, in a span of some days.

JIRA _does_ provide a `resolutionDate` field, but it is common to find workflows misconfigured, and thus I have found it to be unreliable. Sometimes the resolution is never set, or it is not cleared when a ticket is taken back under work.

Therefore, this script tracks the statuses, and determines whether a ticket has entered, and remained, in any of the given `isDone` statuses during the given timeframe.

### Leadtime

With `leadtime` you can see how many milliseconds issues have been in each of the statuses you are interested in.

### Storypoints

With `storypoints` you can see how your storypoints correlate with the actual time spent under development. 

After all, the theory with story points is that they should somehow convert into time. Thus, a 5-pointer take roughly 5x as long as a 1-pointer. This can be interesting feedback to the team about their estimation behavior. Even more interesting is to see how the relationships of various points behave in different windows of time of a team's lifetime: "Are we more accurate in our estimations than a year ago? Why? Why not?"
