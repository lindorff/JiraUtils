import { timesInStatusesForTicket, getKeysInJQL } from "./lib/lib";
import { Config, TicketInfo } from "./lib/interfaces";
import * as fs from "fs";
import * as yargs from "yargs";
const config = <Config>require("./config.json");
const argv = yargs.argv;
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

function prettyPrintTimes(values: { [key: string]: number }, statuses: string[]): string {
    return statuses.map(s => s.toLowerCase()).map(s => values[s] || 0).join(",");
}

function prettyPrintDate(date: Date): string {
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

async function getTicketTimeStrings(keys: string[]): Promise<string[]> {
    const summary = config.showSummary ? "Summary," : "";
    const heading = [`Key,${summary}Created,Finished,${inputStatuses.map(s => s.replace("*", "")).join(",")}`];

    const infoPromises = keys.map(key => timesInStatusesForTicket(key, config.jira, finalStatuses));
    const infoResults = await Promise.all(infoPromises);

    const lines = infoResults.map(info => {
        const finished = info.finished ? prettyPrintDate(info.finished) : "";
        const summary = config.showSummary ? `"${info.summary.replace('"', '\\"')}",` : "";
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

(async () => {
    if (query) {
        keys = await getKeysInJQL(query, config.jira);
    }

    if (keys.length > 0) {
        const strings = await getTicketTimeStrings(keys);

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
        console.log(`
run [OPTIONS] [--query=JQL | KEY1 [KEY2 [...]]]

    --file=FILE_NAME
        Write output to a file instead of standard out.
    --statuses=STATUS_1[,STATUS_2[...]]
        Override the statuses from config.json with a comma separated list.
        e.g. --statuses="foo,bar baz,*done"

Example: run --file=out.csv --query="project in (br,pay) and type in (bug,task,story) and status = done
Example: run --file=out.csv br-1 pay-1
Example: run pay-4000
`);
        process.exit(0);
    }
})();
