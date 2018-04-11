import { Jira } from "../lib/jira";
import { Config } from "../lib/interfaces";
import * as fs from "fs";
import * as yargs from "yargs";

namespace Config {
    export interface DoneTickets {
        project: string;
    }
}

const config = <Config & Config.DoneTickets>Object.assign(
    {},
    require("../config.json"),
    require("../config.donetickets.json")
);

const argv = yargs.argv;

const project = config.project;
const completed = config.statuses.filter(status => status.startsWith("*")).map(status => status.substr(1).trim());

(async () => {
    const errors = [];

    if (!argv["from"]) errors.push("Use --from=2018-01-01 to define start time");
    if (!argv["to"]) errors.push("Use --to=2018-01-02 to define end time");

    if (errors.length > 0) {
        console.log(errors.join("\n"));
        process.exit(1);
    }

    const from: string = argv["from"];
    const to: string = argv["to"];

    console.log(
        `Finding JIRA issues that ended up and stayed in the status${completed.length > 1 ? "es" : ""} ${completed.join(
            ", "
        )} from project ${project} between ${from} and ${to}`
    );

    const result = await Jira.getKeysLandedInStatusDuringTimePeriod(
        project,
        new Date(from),
        new Date(to),
        completed,
        config.jira
    );

    const jql = encodeURIComponent(`key in (${result.join(",")}) order by resolutiondate DESC`);
    console.log(`${config.jira.url}/issues/?jql=${jql}`);
    process.exit(0);
})();
