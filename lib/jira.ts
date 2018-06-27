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

import { Issue, HasChangelog, IssueQueryResponse, JiraConfig, IssueTimings, History, Config } from "./interfaces";
import request from "request-promise-native";
import dateFormat from "dateformat";

export function getIssueStatusEvents(issue: Issue & HasChangelog): History[] {
    const statusChangeHistories = issue.changelog.histories.filter(history => {
        history.items = history.items.filter(
            item => item.field === "status" && item.from !== null && item.to !== null && item.from !== item.to
        );
        return history.items.length > 0;
    });

    return statusChangeHistories;
}

export function returnKeyIfCompletedDuringTheDate(
    issue: Issue & HasChangelog,
    doneStatuses: string[],
    from: Date,
    to: Date
): string {
    doneStatuses = doneStatuses.map(status => status.toLowerCase());

    const sortedHistoriesDuringPeriod = getIssueStatusEvents(issue)
        .filter(history => {
            const created = new Date(history.created);
            return from < created && created < to;
        })
        .sort((a, b) => a.created.localeCompare(b.created));

    if (sortedHistoriesDuringPeriod.length === 0) return null;

    const lastHistoryDuringPeriod = sortedHistoriesDuringPeriod[sortedHistoriesDuringPeriod.length - 1];
    const finishingLastHistories = lastHistoryDuringPeriod.items.filter(
        item => doneStatuses.indexOf(item.toString.toLowerCase()) >= 0
    );
    const lastHistoryDuringPeriodIsAFinishingHistory = finishingLastHistories.length > 0;

    if (lastHistoryDuringPeriodIsAFinishingHistory) {
        return issue.key;
    } else {
        return null;
    }
}

export class Jira {
    public static async JQL_forEach(
        jql: string,
        jira: JiraConfig,
        cb: (issue: Issue) => any,
        expand?: string
    ): Promise<void> {
        let getParams = [`jql=${jql}`];
        if (expand) getParams.push(`expand=${expand}`);

        const getParam = getParams.length == 0 ? "" : `?${getParams.join("&")}`;

        let uri = `${jira.url}/rest/api/2/search${getParam}`;
        let hasMorePages = false;
        let startAt = 0;
        console.log(`Fetching all results from URI ${uri}`);
        do {
            const result = <IssueQueryResponse>JSON.parse(await request(`${uri}&startAt=${startAt}`, { auth: jira }));
            console.log(`Got ${result.startAt}..${result.startAt + result.maxResults}/${result.total}`);

            result.issues.forEach(cb);

            hasMorePages = result.startAt + result.maxResults < result.total;
            startAt = result.startAt + result.maxResults;
        } while (hasMorePages);
        console.log("Done fetching");
        console.log();
    }

    public static async JQL_withChangelog(jql: string, jira: JiraConfig): Promise<(Issue & HasChangelog)[]> {
        return this.JQL(jql, jira, "changelog");
    }

    public static async JQL(jql: string, jira: JiraConfig, expand: "changelog"): Promise<(Issue & HasChangelog)[]>;
    public static async JQL(jql: string, jira: JiraConfig, expand?: string): Promise<Issue[]> {
        const collector: Issue[] = [];
        await this.JQL_forEach(jql, jira, issue => collector.push(issue), expand);
        return collector;
    }

    public static getIssueTimings(issue: Issue & HasChangelog, finalStatuses: string[]): IssueTimings {
        const statusChangeHistories = getIssueStatusEvents(issue);
        const issueCreatedDate = new Date(statusChangeHistories[0].created);

        let doneTime: Date = null;
        let prevStatus: string = null;
        let prevStatusStartTime: Date = issueCreatedDate;
        const timeInStatuses: { [status: string]: number } = {};

        statusChangeHistories.forEach(statusChangeHistory => {
            /* There shouldn't be many status changes in one history entry,
             * but just in case, we'll take the last one */
            const statusChange = statusChangeHistory.items.reverse().find(item => item.field === "status");

            const newStatusStartTime = new Date(statusChangeHistory.created);
            const newStatus = statusChange.toString.toLowerCase();
            const secondsInPreviousStatus = newStatusStartTime.getTime() - prevStatusStartTime.getTime();

            if (prevStatus === null) prevStatus = statusChange.fromString.toLowerCase();

            if (!timeInStatuses[prevStatus]) timeInStatuses[prevStatus] = 0;
            timeInStatuses[prevStatus] += secondsInPreviousStatus;

            prevStatus = newStatus;
            prevStatusStartTime = newStatusStartTime;

            if (finalStatuses.indexOf(newStatus) >= 0) doneTime = newStatusStartTime;
        });

        const secondsInPreviousStatus = new Date().getTime() - prevStatusStartTime.getTime();
        if (!timeInStatuses[prevStatus]) timeInStatuses[prevStatus] = 0;
        timeInStatuses[prevStatus] += secondsInPreviousStatus;

        return {
            key: issue.key,
            summary: issue.fields.summary,
            created: issueCreatedDate,
            finished: doneTime,
            times: timeInStatuses
        };
    }

    public static async getKeysLandedInStatusDuringTimePeriod(
        project: string,
        from: Date,
        to: Date,
        doneStatuses: string[],
        types: string[],
        jira: JiraConfig
    ): Promise<string[]> {
        if (types.length === 0) {
            throw new Error("You need to give at least one issue type");
        }

        const issuesThatWereUpdatedInAnyWay: (Issue & HasChangelog)[] = await this.JQL_withChangelog(
            `project = ${project} and ` +
                `type in (${types.map(type => `"${type}"`).join(",")}) and ` +
                `updatedDate >= ${dateFormat(from, "yyyy-mm-dd")} and ` +
                `updatedDate <= ${dateFormat(to, "yyyy-mm-dd")}`,
            jira
        );

        return issuesThatWereUpdatedInAnyWay
            .map(issue => returnKeyIfCompletedDuringTheDate(issue, doneStatuses, from, to))
            .filter(key => !!key)
            .sort();
    }

    public static issueHasChangelog<IssueWithChangelog extends Issue & HasChangelog>(
        issue: Issue
    ): issue is IssueWithChangelog {
        return !!issue["changelog"];
    }

    public static issuesHaveChangelogs<IssueWithChangelog extends Issue & HasChangelog>(
        issues: Issue[]
    ): issues is IssueWithChangelog[] {
        for (var i = 0; i < issues.length; i++) {
            if (!this.issueHasChangelog(issues[i])) return false;
        }
        return true;
    }

    public static getFinalStatuses(config: Config): string[] {
        return config.statuses.filter(status => status.isDone).map(status => status.name);
    }
}
