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
import { Issue, Config, Argv, Script } from "../lib/interfaces";
import * as fs from "fs";
import dateformat from "dateformat";
import jiraConfig from "../config.jira.json";

const script: Script = async (config: Config, argv: Argv) => {
    function getOutputFileName(): string {
        const fromArgv = argv.output;
        const fromConfig = config.scripts.storypoints.output;

        if (fromArgv) {
            return fromArgv;
        } else if (fromConfig) {
            return fromConfig;
        } else {
            console.error("An output file name is required");
            console.error("Either define the `output` in config.project.*.json, or give it as an --output parameter");
            process.exit(1);
        }
    }

    // let's try to get the output filename, and show an error if it's not configured.
    const FILENAME: string = getOutputFileName();

    const DATE_FORMAT = "yyyy-mm-dd HH:MM:ss";

    const FINAL_STATUSES = config.statuses
        .filter(status => status.isDone)
        .map(status => `"${status.name.toLowerCase()}"`);

    const IGNORE_STATUSES = config.scripts.storypoints.ignoreStatuses.map(status => status.toLowerCase());

    const issuesWithStoryPoints = await Jira.JQL_withChangelog(
        `project = ${config.project} ` +
            `and type in (${config.scripts.storypoints.types.join(",")}) ` +
            `and "${config.scripts.storypoints.propertyName.jqlName}" > 0 ` +
            `and status in (${FINAL_STATUSES.join(",")})`,
        jiraConfig
    );

    const issuesWithStoryPointsMap = new Map<string, Issue>();
    issuesWithStoryPoints.forEach(issue => issuesWithStoryPointsMap.set(issue.key, issue));

    const issueTimings = issuesWithStoryPoints.map(issue => Jira.getIssueTimings(issue, FINAL_STATUSES));

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
