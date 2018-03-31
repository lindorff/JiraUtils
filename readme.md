# Jira Lead Times

This script scrapes the Lindorff JIRA to get times on how long a ticket has been in any particular status.

**Note:** There's quite a few of shortcuts made when developing this. If (when) you encounter something weird, just [file an issue in GitHub](https://github.com/lindorff/JiraLead/issues/new) or tell [Henrik Paul](mailto:henrik.paul@lindorff.com) directly.

## 0: Download Node.js

This script needs [Node.js](https://nodejs.org/) to be installed on your computer. I recommend [the "Current" version](https://nodejs.org/en/download/current/).

You can check if you have it installed by opening the command prompt (press <kbd>Win</kbd>+<kbd>R</kbd> and run "cmd") and then check the `npm` command:

    $> npm --version
    4.2.0

## 1: Download the script

Download [the latest ZIP file](https://github.com/lindorff/JiraLead/archive/master.zip) from [GitHub](https://github.com/lindorff/JiraLead), and unpack it somewhere you remember (such as `c:\jiralead\`)

## 2: Installation

Before running this the first time, run this command in the script's directory, to download all kinds of stuff

    $> npm install

Check the `config.*.json` files in the directory for all configurations needed.

In your statuses, you can mark the statuses you consider as "done" with an asterisk before the name (as in `config.json.example`). If none given, last given status is assumed as finished.

### Config.json

| Config      | Desc                                                                                                     |
| ----------- | -------------------------------------------------------------------------------------------------------- |
| `jira.user` | The user to use when querying Jira.                                                                      |
| `jira.pass` | The password to use when querying Jira.                                                                  |
| `jira.url`  | The http/https address to Jira.                                                                          |
| `statuses`  | The statuses that you are interested in. Mark the ones you consider as final with an asterisk (i.e. `*`) |

### Config.leadtime.json

| Config        | Desc                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------ |
| `showSummary` | Setting to "true" will get you the summary text of the ticket into the result set as well. |

### Config.storypoints.json

| Config                | Desc                                                             |
| --------------------- | ---------------------------------------------------------------- |
| `storyPoints.jqlName` | The name of the field, as you would search for them with JQL     |
| `storyPoints.apiName` | The name of the field as it is returned via the REST API         |
| `project`             | The Jira project name (for a ticket like `ABC-1`, this is `ABC`) |
| `types`               | The types of issues that you are interested in                   |
| `ignoreStatuses`      | Which statuses not to count towards the in-progress time         |
