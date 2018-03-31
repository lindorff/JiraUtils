import { Jira } from "../lib/jira";
import { Config, IssueTimings, Issue, HasChangelog } from "../lib/interfaces";
import * as fs from "fs";
import * as yargs from "yargs";
const config = <Config>require("../config.json");
const STORY_POINTS_CUSTOM_FIELD = "customfield_10005";
import * as dateformat from "dateformat";

const DATE_FORMAT = "yyyy-mm-dd HH:MM:ss";

(async () => {
    const issuesWithStoryPoints = await Jira.JQL_withChangelog(
        'project = giit and type in (story,task,bug) and "Story Points" > 0 and status in (Completed, "Live in Production")',
        config.jira
    );

    const issuesWithStoryPointsMap = new Map<string, Issue>();
    issuesWithStoryPoints.forEach(issue => issuesWithStoryPointsMap.set(issue.key, issue));

    const issueTimings = issuesWithStoryPoints.map(issue =>
        Jira.getIssueTimings(issue, ["completed", "live in production"])
    );

    const storyPointsObj = {};

    issueTimings.forEach(issueTiming => {
        const storyPoints = <number>issuesWithStoryPointsMap.get(issueTiming.key).fields[STORY_POINTS_CUSTOM_FIELD];
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
                if (
                    [
                        "idea",
                        "groomed",
                        "to do",
                        "completed",
                        "live in production",
                        "grooming",
                        "gathering requirements"
                    ].indexOf(status) == -1
                ) {
                    millis += timing.times[status];
                }
            });

            buffer += [storypoints, key, summary, finished, millis].join(",") + "\n";
        });
    });

    fs.writeFileSync("result.csv", buffer, { encoding: "utf-8" });
})();
