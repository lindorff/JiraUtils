import { Jira } from "../lib/jira";
import { Config, IssueTimings, Issue, HasChangelog } from "../lib/interfaces";
import * as fs from "fs";
import * as yargs from "yargs";
import * as dateformat from "dateformat";
const config = <Config & Config.Storypoints>Object.assign(
    {},
    require("../config.json"),
    require("../config.storypoints.json")
);

namespace Config {
    export interface Storypoints {
        storyPoints: {
            jqlName: string;
            apiName: string;
        };
        project: string;
        types: string[];
        ignoreStatuses: string[];
    }
}

if (!yargs.argv.output) {
    console.log("Use with --output=[filename]\n");
    process.exit(0);
}

const FILENAME: string = yargs.argv.output;

const DATE_FORMAT = "yyyy-mm-dd HH:MM:ss";

const FINAL_STATUSES = config.statuses
    .filter(status => status.indexOf("*") >= 0)
    .map(status => status.toLowerCase())
    .map(status => status.replace("*", ""))
    .map(status => `"${status}"`);

const IGNORE_STATUSES = config.ignoreStatuses.map(status => status.toLowerCase());

(async () => {
    const issuesWithStoryPoints = await Jira.JQL_withChangelog(
        `project = ${config.project} ` +
            `and type in (${config.types.join(",")}) ` +
            `and "${config.storyPoints.jqlName}" > 0 ` +
            `and status in (${FINAL_STATUSES.join(",")})`,
        config.jira
    );

    const issuesWithStoryPointsMap = new Map<string, Issue>();
    issuesWithStoryPoints.forEach(issue => issuesWithStoryPointsMap.set(issue.key, issue));

    const issueTimings = issuesWithStoryPoints.map(issue =>
        Jira.getIssueTimings(issue, ["completed", "live in production"])
    );

    const storyPointsObj = {};

    issueTimings.forEach(issueTiming => {
        const storyPoints = <number>issuesWithStoryPointsMap.get(issueTiming.key).fields[config.storyPoints.apiName];
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
})();
