import { Jira } from "../lib/jira";
import { Issue, Config, Argv, Script } from "../lib/interfaces";
import * as fs from "fs";
import dateformat from "dateformat";
import jiraConfig from "../config.jira.json";

const script: Script = async (config: Config, argv: Argv) => {
    if (!argv.output) {
        console.log("Use with --output=[filename]\n");
        process.exit(0);
    }

    const FILENAME: string = argv.output;

    const DATE_FORMAT = "yyyy-mm-dd HH:MM:ss";

    const FINAL_STATUSES = config.statuses
        .filter(status => status.indexOf("*") >= 0)
        .map(status => status.toLowerCase())
        .map(status => status.replace("*", ""))
        .map(status => `"${status}"`);

    const IGNORE_STATUSES = config.scripts.storypoints.ignoreStatuses.map(status => status.toLowerCase());

    const issuesWithStoryPoints = await Jira.JQL_withChangelog(
        `project = ${config.scripts.storypoints.project} ` +
            `and type in (${config.scripts.storypoints.types.join(",")}) ` +
            `and "${config.scripts.storypoints.propertyName.jqlName}" > 0 ` +
            `and status in (${FINAL_STATUSES.join(",")})`,
        jiraConfig
    );

    const issuesWithStoryPointsMap = new Map<string, Issue>();
    issuesWithStoryPoints.forEach(issue => issuesWithStoryPointsMap.set(issue.key, issue));

    const issueTimings = issuesWithStoryPoints.map(issue =>
        Jira.getIssueTimings(issue, ["completed", "live in production"])
    );

    const storyPointsObj = {};

    issueTimings.forEach(issueTiming => {
        const issue = issuesWithStoryPointsMap.get(issueTiming.key);
        const storyPoints = <number>issue.fields[config.scripts.storypoints.propertyName.apiName];

        let timings = storyPointsObj[storyPoints];
        if (!timings) {
            timings = [];
            storyPointsObj[storyPoints] = timings;
        }
        timings.push(issueTiming);
    });

    let buffer = "StoryPoints,Key,Summary,Finished,Millis\n";
    Object.keys(storyPointsObj).forEach(storypoints => {
        const timings = storyPointsObj[storypoints];
        timings.forEach(timing => {
            const key = timing.key;
            const summary = `"${timing.summary.replace('"', '\\"')}"`;
            const finished = dateformat(timing.finished, DATE_FORMAT);

            let millis = 0;
            Object.keys(timing.times).forEach(status => {
                if (IGNORE_STATUSES.indexOf(status) == -1) {
                    millis += timing.times[status];
                }
            });

            buffer += [storypoints, key, summary, finished, millis].join(",") + "\n";
        });
    });

    fs.writeFileSync(FILENAME, buffer, { encoding: "utf-8" });
};

export = script;
