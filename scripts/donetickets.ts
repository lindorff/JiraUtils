import { Jira } from "../lib/jira";
import { Config, Argv, Script } from "../lib/interfaces";
import jiraConfig from "../config.jira.json";

const script: Script = async (config: Config, argv: Argv) => {
    const project = config.project;
    const completed = config.statuses.filter(status => status.isDone).map(status => status.name);

    const errors = [];

    if (!argv["from"]) errors.push("Use --from=2018-01-01 to define start time");

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
        getToDateOrDefault(to),
        completed,
        jiraConfig
    );

    const jql = encodeURIComponent(`key in (${result.join(",")}) order by resolutiondate DESC`);
    console.log(`${jiraConfig.url}/issues/?jql=${jql}`);
    process.exit(0);
};

function getToDateOrDefault(to) {
    if (to) {
        return new Date(to);
    } else {
        //We want to have date from the future so that we are sure we include all done tickets.
        //Jira defaults date to midnight so tickets done today wouldn't be included if we would use today as default.
        var tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow;
    }
}

export = script;
