# Jira Lead Times

This script scrapes the Lindorff JIRA to get times on how long a ticket has been in any particular status.

**Note:** This only supports Payment Core's JIRA workflow for now.

## Installation

Before running this the first time, run this command in the software directory, to download all kinds of stuff:

    $> npm install

Then you need to create have a `config.json` file where you give the JIRA credentials that should be used to retrieve the info, and the statuses that your report will use. You probably want to copy the example file as a template and modify it to your needs.

    $> copy config.json.example config.json
    $> notepad config.json

## Usage examples

    $> run PAY-1 BR-1
    $> run --query="project in (pay,br) AND status = 'done' AND type in (bug,task,story)"

The output format is `$KEY, $CREATION_DATE, $DONE_DATE, $STATUS_TIMES`, where `$STATUS_TIMES` is a comma-separated list of milliseconds in each of the statuses.

For example:

    Key,Created,Finished,Idea,Gathering Requirements,Ready for development,In Development,To Approve,In Approval,Done,Archived,Invalid
    BR-1358,2017-5-17,2017-5-17,13157,0,3536031,55516,0,0,12537224,0,0