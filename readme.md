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

Then you need to create have a `config.json` file where you give the JIRA credentials that should be used to retrieve the info, and the statuses that your report will use. You probably want to copy the example file as a template and modify it to your needs.

    $> copy config.json.example config.json
    $> notepad config.json

In your statuses, you need to mark the ones you consider as "done" with an asterisk before the name (as in `config.json.example`). Otherwise the last given status is assumed as finished.

## 3: Usage examples

    $> run PAY-1 BR-1
    $> run --query="project in (pay,br) AND status = 'done' AND type in (bug,task,story)"

_Run the script without any arguments to see all available options_

You can also specify the `--file` flag, and you'll get the results written in the given file. Without the flag, you'll get the results in the command window. So, like this:

    $> run --file=out.csv PAY-1

The output format for each line is `$KEY, $CREATION_DATE, $DONE_DATE, $STATUS_TIMES`, where `$STATUS_TIMES` is a comma-separated list of milliseconds in each of the statuses.

For example:

    Key,Created,Finished,Idea,Gathering Requirements,Ready for development,In Development,To Approve,In Approval,Done,Archived,Invalid
    BR-1358,2017-5-17,2017-5-17,13157,0,3536031,55516,0,0,12537224,0,0
