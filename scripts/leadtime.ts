import { Jira } from "../lib/jira";
import { Issue, HasChangelog, Config, Argv, Script } from "../lib/interfaces";
import * as fs from "fs";
import jiraConfig from "../config.jira.json";

const script: Script = async (config: Config, argv: Argv) => {
    let keys = <string[]>(argv.query ? [] : argv._);
    const query = <string>(argv.query ? argv.query : null);
    const file = <string>(argv.file ? argv.file : null);

    const inputStatuses = getInputStatuses();

    const lowercaseStatuses = inputStatuses.map(status => status.toLowerCase());
    const statuses = lowercaseStatuses.map(status => status.replace("*", ""));
    const finalStatuses = lowercaseStatuses
        .filter(status => status.indexOf("*") >= 0)
        .map(status => status.replace("*", ""));

    if (finalStatuses.length === 0) {
        const finalStatusGuess = statuses[statuses.length - 1];
        console.log(`No status marked as final in the config.json. Guessing '${finalStatusGuess}' as the final status`);
        console.log('Mark the statuses that close a ticket with a "*" before the status name in your config.json');
        console.log();
        finalStatuses.push(finalStatusGuess);
    }

    function getInputStatuses(): string[] {
        if (argv.statuses) {
            return argv.statuses.split(",");
        } else {
            return config.statuses;
        }
    }

    function showSummary(): boolean {
        if (argv.showSummary) {
            return true;
        } else if (argv.hideSummary) {
            return false;
        } else {
            return config.scripts.leadtime.showSummary;
        }
    }

    function prettyPrintTimes(values: { [key: string]: number }, statuses: string[]): string {
        return statuses
            .map(s => s.toLowerCase())
            .map(s => values[s] || 0)
            .join(",");
    }

    function prettyPrintDate(date: Date): string {
        return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    }

    function getIssueTimeStrings<IssueWithChangelog extends Issue & HasChangelog>(
        issues: IssueWithChangelog[]
    ): string[] {
        const summary = showSummary() ? "Summary," : "";
        const heading = [
            `Key,Story Points,${summary}Created,Finished,${inputStatuses.map(s => s.replace("*", "")).join(",")}`
        ];

        const infoResults = issues.map(issue => Jira.getIssueTimings(issue, finalStatuses));

        const lines = infoResults.map(info => {
            const finished = info.finished ? prettyPrintDate(info.finished) : "";
            const summary = showSummary() ? `"${info.summary.replace('"', '\\"')}",` : "";
            return (
                info.key +
                "," +
                summary +
                prettyPrintDate(info.created) +
                "," +
                finished +
                "," +
                prettyPrintTimes(info.times, statuses)
            );
        });

        return heading.concat(lines);
    }

    let issues: Issue[] = [];
    if (query) {
        issues = await Jira.JQL(query, jiraConfig, "changelog");
    } else if (keys.length > 0) {
        issues = await Jira.JQL(`key in (${keys.join(",")})`, jiraConfig, "changelog");
    } else {
        console.log(`
    run leadtime [OPTIONS] [--query=JQL | KEY1 [KEY2 [...]]]
    
        --file=FILE_NAME
            Write output to a file instead of standard out.
        --statuses=STATUS_1[,STATUS_2[...]]
            Override the statuses from config.json with a comma separated list.
            e.g. --statuses="foo,bar baz,*done"
        --showSummary
        --hideSummary
            Override the setting from config.json
    
    Example: run --file=out.csv --query="project in (br,pay) and type in (bug,task,story) and status = done
    Example: run --file=out.csv br-1 pay-1
    Example: run pay-4000
    `);
        process.exit(0);
    }

    if (Jira.issuesHaveChangelogs(issues)) {
        const strings = await getIssueTimeStrings(issues);

        if (!file) {
            strings.forEach(line => {
                console.log(line);
            });
        } else {
            console.log(`Writing to ${file}`);
            fs.writeFileSync(file, strings.join("\n"), { encoding: "utf-8" });
            console.log(`Success!`);
        }
    } else {
        console.error("Tickets were not fetched properly :/");
    }
};

export = script;
