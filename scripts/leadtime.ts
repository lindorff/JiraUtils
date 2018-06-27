/*
Copyright 2018 Lindorff Oy

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { Jira } from "../lib/jira";
import { Issue, HasChangelog, Config, Argv, Script, IssueTimings } from "../lib/interfaces";
import * as fs from "fs";
import jiraConfig from "../config.jira.json";

async function script(config: Config, argv: Argv) {
    let keys = <string[]>(argv.query ? [] : argv._);
    const query = <string>(argv.query ? argv.query : null);
    const file = <string>(argv.file ? argv.file : null);

    const statuses: string[] = config.statuses.map(status => status.name);
    const finalStatuses: string[] = Jira.getFinalStatuses(config);

    if (finalStatuses.length === 0) {
        console.error("No statuses marked as final. This is required for the script to work.");
        console.error('See readme.md and the section of "Status JSON Structure" for more info.');
        process.exit(1);
    }

    function showSummary(): boolean {
        if (argv.showSummary) {
            return true;
        } else if (argv.hideSummary) {
            return false;
        } else {
            const showSummary = config.scripts.leadtime.showSummary;
            return showSummary !== undefined ? showSummary : false;
        }
    }

    let issues: (Issue & HasChangelog)[] = [];
    if (query) {
        issues = await Jira.JQL_withChangelog(query, jiraConfig);
    } else if (keys.length > 0) {
        issues = await Jira.JQL_withChangelog(`key in (${keys.join(",")})`, jiraConfig);
    } else {
        console.log(`
    run --project=[project] leadtime [OPTIONS] [--query=JQL | KEY1 [KEY2 [...]]]
    
        --file=FILE_NAME
            Write output to a file instead of standard out.
        --showSummary
        --hideSummary
            Override the setting from config.project.*.json
    
    Example: run --project=foo leadtime --file=out.csv --query="project in (abc,bcd) and type in (bug,task,story) and status = done"
    Example: run --project=foo leadtime --file=out.csv ABC-1 BCD-1
    Example: run --project=foo leadtime ABC-1
    `);
        process.exit(0);
    }

    const strings = await script.getIssueTimeStrings(issues, statuses, finalStatuses, showSummary());

    if (!file) {
        strings.forEach(line => {
            console.log(line);
        });
    } else {
        console.log(`Writing to ${file}`);
        fs.writeFileSync(file, strings.join("\n"), { encoding: "utf-8" });
        console.log(`Success!`);
    }
}

function prettyPrintDate(date: Date): string {
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function prettyPrintTimes(values: { [key: string]: number }, statuses: string[]): string {
    return statuses
        .map(s => s.toLowerCase())
        .map(s => values[s] || 0)
        .join(",");
}

function headingString(showSummary: boolean, statuses: string[]): string {
    const headings = [];
    headings.push("Key");
    if (showSummary) headings.push("Summary");
    headings.push("Created");
    headings.push("Finished");
    headings.push(...statuses);
    return headings.join(",");
}

function issueString(showSummary: boolean, statuses: string[]) {
    return (info: IssueTimings): string => {
        const row = [];
        row.push(info.key);
        if (showSummary) {
            const quoteEscapedSummary = '"' + info.summary.replace('"', '\\"') + '"';
            row.push(quoteEscapedSummary);
        }
        row.push(prettyPrintDate(info.created));
        row.push(info.finished ? prettyPrintDate(info.finished) : "");
        row.push(prettyPrintTimes(info.times, statuses));
        return row.join(",");
    };
}

namespace script {
    export function getIssueTimeStrings<IssueWithChangelog extends Issue & HasChangelog>(
        issues: IssueWithChangelog[],
        statuses: string[],
        finalStatuses: string[],
        showSummary: boolean
    ): string[] {
        const infoResults = issues.map(issue => Jira.getIssueTimings(issue, finalStatuses));

        const heading = headingString(showSummary, statuses);
        const lines = infoResults.map(issueString(showSummary, statuses));

        return [heading].concat(lines);
    }
}

const thisRaisesACompileTimeErrorIfScriptIsMalformatted: Script = script;

export = script;
