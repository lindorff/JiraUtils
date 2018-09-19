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

import { Issue, HasChangelog, HistoryItem, ProjectConfig } from "../lib/interfaces";
import { getIssueStatusEvents, returnKeyIfCompletedDuringTheDate, Jira } from "../lib/jira";
import { StatusHelper } from "./statusHelper";

const toStatus = StatusHelper.toStatus;

const A_DAY_IN_MILLIS = 86400000;

function config(partial: any): ProjectConfig {
    const emptyConfig: ProjectConfig = {
        project: null,
        statuses: [],
        scripts: {
            donetickets: { types: [] },
            leadtime: {},
            storypoints: {
                propertyName: {
                    jqlName: null,
                    apiName: null
                },
                types: [],
                ignoreStatuses: []
            }
        }
    };

    return Object.assign(emptyConfig, partial);
}

function historyItem(partial: any): HistoryItem {
    const historyItem: HistoryItem = {
        field: null,
        fieldtype: null,
        from: null,
        fromString: null,
        to: null,
        toString: null
    };

    return Object.assign(historyItem, partial);
}

function statusHistoryItem(partial: any = {}): HistoryItem {
    const statusHistoryItem = {
        field: "status",
        fieldtype: "jira",
        from: "1",
        to: "2",
        fromString: "a",
        toString: "b"
    };
    return historyItem(Object.assign(statusHistoryItem, partial));
}

describe("Jira", () => {
    let exampleIssue: Issue & HasChangelog = null;
    beforeEach(async () => {
        exampleIssue = <any>JSON.parse(JSON.stringify(await import("./ABC-1.json")));
    });

    describe("getIssueStatusEvents", () => {
        it("should find a status item", () => {
            exampleIssue.changelog.histories[0].items = [historyItem({ field: "status", from: "0", to: "1" })];

            const statusEvents = getIssueStatusEvents(exampleIssue);
            expect(statusEvents).toHaveLength(1);
            expect(statusEvents[0].items).toHaveLength(1);

            const item = statusEvents[0].items[0];
            expect(item.from).toBe("0");
            expect(item.to).toBe("1");
        });

        it("should find many status items", () => {
            exampleIssue.changelog.histories[0].items = [
                historyItem({ field: "status", from: "0", to: "1" }),
                historyItem({ field: "status", from: "2", to: "3" })
            ];

            const statusEvents = getIssueStatusEvents(exampleIssue);
            expect(statusEvents).toHaveLength(1);
            expect(statusEvents[0].items).toHaveLength(2);

            const item1 = statusEvents[0].items[0];
            expect(item1.from).toBe("0");
            expect(item1.to).toBe("1");

            const item2 = statusEvents[0].items[1];
            expect(item2.from).toBe("2");
            expect(item2.to).toBe("3");
        });

        it("should discard any non-status items", () => {
            exampleIssue.changelog.histories[0].items = [historyItem({ field: "foo", from: "0", to: "1" })];

            const statusEvents = getIssueStatusEvents(exampleIssue);
            expect(statusEvents).toHaveLength(0);
        });

        it("should discard any status items without to/from fields", () => {
            exampleIssue.changelog.histories[0].items = [historyItem({ field: "status" })];

            const statusEvents = getIssueStatusEvents(exampleIssue);
            expect(statusEvents).toHaveLength(0);
        });

        it("should discard any status items with the same to and from fields", () => {
            exampleIssue.changelog.histories[0].items = [historyItem({ field: "status", from: "0", to: "0" })];

            const statusEvents = getIssueStatusEvents(exampleIssue);
            expect(statusEvents).toHaveLength(0);
        });
    });

    describe("returnKeyIfCompletedDuringTheDate", () => {
        it("should return the issue's key if the issue is completed during the date interval", () => {
            exampleIssue.key = "ABC-1";
            exampleIssue.changelog.histories[0].created = "2017-01-02T09:00:00.000+0000";
            exampleIssue.changelog.histories[0].items = [
                statusHistoryItem({ from: "0", fromString: "start", to: "1", toString: "finish" })
            ];
            const from = new Date("2017-01-02");
            const to = new Date("2017-01-03");

            const key = returnKeyIfCompletedDuringTheDate(exampleIssue, [toStatus("finish", true)], from, to);
            expect(key).toBe("ABC-1");
        });

        it("should return null if the issue is completed before the date interval", () => {
            exampleIssue.key = "ABC-1";
            exampleIssue.changelog.histories[0].created = "2017-01-01T09:00:00.000+0000";
            exampleIssue.changelog.histories[0].items = [
                statusHistoryItem({ from: "0", fromString: "start", to: "1", toString: "finish" })
            ];
            const from = new Date("2017-01-02");
            const to = new Date("2017-01-03");

            const key = returnKeyIfCompletedDuringTheDate(exampleIssue, [toStatus("finish")], from, to);
            expect(key).toBeNull();
        });

        it("should return null if the issue is completed after the date interval", () => {
            exampleIssue.key = "ABC-1";
            exampleIssue.changelog.histories[0].created = "2017-01-04T09:00:00.000+0000";
            exampleIssue.changelog.histories[0].items = [
                statusHistoryItem({ from: "0", fromString: "start", to: "1", toString: "finish" })
            ];
            const from = new Date("2017-01-02");
            const to = new Date("2017-01-03");

            const key = returnKeyIfCompletedDuringTheDate(exampleIssue, [toStatus("finish")], from, to);
            expect(key).toBeNull();
        });

        it("should return null if the issue is not completed at the end of the period, even if it's once done during it", () => {
            exampleIssue.key = "ABC-1";
            exampleIssue.changelog.histories[0].created = "2017-01-02T09:00:00.000+0000";
            exampleIssue.changelog.histories[0].items = [
                statusHistoryItem({ from: "0", fromString: "start", to: "1", toString: "finish" })
            ];
            exampleIssue.changelog.histories[1].created = "2017-01-02T09:30:00.000+0000";
            exampleIssue.changelog.histories[1].items = [
                statusHistoryItem({ from: "1", fromString: "finish", to: "0", toString: "start" })
            ];
            const from = new Date("2017-01-02");
            const to = new Date("2017-01-03");

            const key = returnKeyIfCompletedDuringTheDate(exampleIssue, [toStatus("finish")], from, to);
            expect(key).toBeNull();
        });

        it("should return key if the issue is completed at the end of the period, even if it's changed done after it", () => {
            exampleIssue.key = "ABC-1";
            exampleIssue.changelog.histories[0].created = "2017-01-02T09:00:00.000+0000";
            exampleIssue.changelog.histories[0].items = [
                statusHistoryItem({ from: "0", fromString: "start", to: "1", toString: "finish" })
            ];
            exampleIssue.changelog.histories[1].created = "2017-01-05T09:30:00.000+0000";
            exampleIssue.changelog.histories[1].items = [
                statusHistoryItem({ from: "1", fromString: "finish", to: "0", toString: "start" })
            ];
            const from = new Date("2017-01-02");
            const to = new Date("2017-01-03");

            const key = returnKeyIfCompletedDuringTheDate(exampleIssue, [toStatus("finish", true)], from, to);
            expect(key).toBe("ABC-1");
        });

        it("should return null if the issue is completed before the period, and changed during it", () => {
            exampleIssue.key = "ABC-1";
            exampleIssue.changelog.histories[0].created = "2017-01-01T09:00:00.000+0000";
            exampleIssue.changelog.histories[0].items = [
                statusHistoryItem({ from: "0", fromString: "start", to: "1", toString: "finish" })
            ];
            exampleIssue.changelog.histories[1].created = "2017-01-02T09:30:00.000+0000";
            exampleIssue.changelog.histories[1].items = [
                statusHistoryItem({ from: "1", fromString: "finish", to: "0", toString: "start" })
            ];
            const from = new Date("2017-01-02");
            const to = new Date("2017-01-03");

            const key = returnKeyIfCompletedDuringTheDate(exampleIssue, [toStatus("finish")], from, to);
            expect(key).toBeNull();
        });

        it("should return null if the issue has no transitions", () => {
            exampleIssue.key = "ABC-1";
            exampleIssue.changelog.histories = [];
            const from = new Date("2017-01-02");
            const to = new Date("2017-01-03");

            const key = returnKeyIfCompletedDuringTheDate(exampleIssue, [toStatus("finish")], from, to);
            expect(key).toBeNull();
        });
    });

    describe("getDoneStatuses", () => {
        it("should return an empty array on an empty input", () => {
            const doneStatuses = Jira.getDoneStatuses([]);
            expect(doneStatuses).toHaveLength(0);
        });

        it("should return an empty array on only-name-object input", () => {
            const statuses = [{ name: "foo" }, { name: "bar" }];
            const doneStatuses = Jira.getDoneStatuses(statuses);
            expect(doneStatuses).toHaveLength(0);
        });

        it("should return an empty array on object input with explicit isDone=false", () => {
            const statuses = [{ name: "foo", isDone: false }];
            const doneStatuses = Jira.getDoneStatuses(statuses);
            expect(doneStatuses).toHaveLength(0);
        });

        it("should return the isDone status from the mixed input", () => {
            const mixedStatuses = [{ name: "foo", isDone: false }, { name: "bar" }, { name: "baz", isDone: true }];

            const doneStatuses = Jira.getDoneStatuses(mixedStatuses);

            expect(doneStatuses).toHaveLength(1);
            const doneStatusNames = doneStatuses.map(status => status.name);
            expect(doneStatusNames).toContain("baz");
        });
    });

    describe("isDoneStatus", () => {
        it("should return false on an empty status config", () => {
            const isDoneStatus = Jira.isDoneStatus([], "Some_status");
            expect(isDoneStatus).toBeFalsy;
        });

        it("should return false on not done status as input", () => {
            const statuses = [{ name: "foo", isDone: false }];
            const isDoneStatus = Jira.isDoneStatus(statuses, "foo");
            expect(isDoneStatus).toBeFalsy;
        });

        it("should return true on done status as input", () => {
            const statuses = [{ name: "foo", isDone: true }];
            const isDoneStatus = Jira.isDoneStatus(statuses, "foo");
            expect(isDoneStatus).toBeTruthy;
        });

        it("should be case insensitive", () => {
            const statuses = [{ name: "Foo", isDone: true }];
            const isDoneStatus = Jira.isDoneStatus(statuses, "FOo");
            expect(isDoneStatus).toBeTruthy;
        });
    });

    describe("getKeysLandedInStatusDuringTimePeriod", () => {
        it("should query all issue types, if no types are given", async () => {
            // capture JQL by mocking the function call
            let jql: string = null;
            Jira.JQL_withChangelog = inputJQL => {
                jql = inputJQL;
                return Promise.resolve([]);
            };

            const key = "KEY";
            const from = new Date("2018-01-01");
            const to = new Date("2018-01-02");
            const issueTypes = [];
            const jiraConfig = <any>{};

            const IGNORE_RESULT = await Jira.getKeysLandedInStatusDuringTimePeriod(
                key,
                from,
                to,
                [],
                issueTypes,
                jiraConfig
            );

            expect(jql).toBe(`project = KEY and updatedDate >= 2018-01-01 and updatedDate <= 2018-01-02`);
        });

        it("should query only the issue types defined", async () => {
            // capture JQL by mocking the function call
            let jql: string = null;
            Jira.JQL_withChangelog = inputJQL => {
                jql = inputJQL;
                return Promise.resolve([]);
            };

            const key = "KEY";
            const from = new Date("2018-01-01");
            const to = new Date("2018-01-02");
            const issueTypes = ["story", "bug"];
            const jiraConfig = <any>{};

            const IGNORE_RESULT = await Jira.getKeysLandedInStatusDuringTimePeriod(
                key,
                from,
                to,
                [],
                issueTypes,
                jiraConfig
            );

            expect(jql).toBe(
                `project = KEY and ` +
                    `type in ("story","bug") and ` +
                    `updatedDate >= 2018-01-01 and ` +
                    `updatedDate <= 2018-01-02`
            );
        });
    });

    describe("getIssueTimings", () => {
        describe("property: finished", () => {
            it("should be null if the issue has not finished", () => {
                exampleIssue.changelog.histories[0].items = [statusHistoryItem()];
                const timings = Jira.getIssueTimings(exampleIssue, []);
                expect(timings.finished).toBeNull();
            });

            it("should be found from a single finishing status change", () => {
                const DONE_STATUS = { name: "finish", isDone: true };
                exampleIssue.changelog.histories[0].items = [statusHistoryItem({ toString: DONE_STATUS.name })];
                exampleIssue.changelog.histories[0].created = "2018-01-01";

                const timings = Jira.getIssueTimings(exampleIssue, [DONE_STATUS]);

                expect(timings.finished).not.toBeNull();
                expect(timings.finished.getFullYear()).toBe(2018);
            });

            it("should be the first one of many concurrent, same, finishing statuses", () => {
                const DONE_STATUS = { name: "finish", isDone: true };
                exampleIssue.changelog.histories[0].items = [statusHistoryItem({ toString: DONE_STATUS.name })];
                exampleIssue.changelog.histories[0].created = "2018-01-01";
                exampleIssue.changelog.histories[1].items = [
                    statusHistoryItem({
                        fromString: DONE_STATUS.name,
                        toString: DONE_STATUS.name
                    })
                ];
                exampleIssue.changelog.histories[1].created = "2018-01-02";

                const timings = Jira.getIssueTimings(exampleIssue, [DONE_STATUS]);

                expect(timings.finished).not.toBeNull();
                expect(timings.finished.getFullYear()).toBe(2018);
                expect(timings.finished.getDate()).toBe(1);
            });

            it("should be the first one of many concurrent, different, finishing statuses", () => {
                const DONE_STATUS1 = { name: "finish1", isDone: true };
                const DONE_STATUS2 = { name: "finish2", isDone: true };

                exampleIssue.changelog.histories[0].items = [statusHistoryItem({ toString: DONE_STATUS1.name })];
                exampleIssue.changelog.histories[0].created = "2018-01-01";
                exampleIssue.changelog.histories[1].items = [
                    statusHistoryItem({
                        fromString: DONE_STATUS1.name,
                        toString: DONE_STATUS2.name
                    })
                ];
                exampleIssue.changelog.histories[1].created = "2018-01-02";

                const timings = Jira.getIssueTimings(exampleIssue, [DONE_STATUS1, DONE_STATUS2]);

                expect(timings.finished).not.toBeNull();
                expect(timings.finished.getFullYear()).toBe(2018);
                expect(timings.finished.getDate()).toBe(1);
            });

            it("should be null if the issue has become un-finished", () => {
                const DONE_STATUS = { name: "finish", isDone: true };
                const NOT_DONE_STATUS = { name: "foo", isDone: false };

                exampleIssue.changelog.histories[0].items = [statusHistoryItem({ toString: DONE_STATUS.name })];
                exampleIssue.changelog.histories[0].created = "2018-01-01";
                exampleIssue.changelog.histories[1].items = [statusHistoryItem({ toString: NOT_DONE_STATUS.name })];
                exampleIssue.changelog.histories[1].created = "2018-01-02";

                const timings = Jira.getIssueTimings(exampleIssue, [DONE_STATUS]);

                expect(timings.finished).toBeNull();
            });
        });

        it("should handle data correctly if histories are oldest-first", () => {
            const DONE_STATUS = { name: "finish", isDone: true };
            const DOING = { name: "doing", isDone: false };
            const TODO = { name: "todo", isDone: false };

            exampleIssue.changelog.histories[0].created = "2018-01-01";
            exampleIssue.changelog.histories[0].items = [
                statusHistoryItem({ from: "1", fromString: TODO.name, to: "2", toString: DOING.name })
            ];

            exampleIssue.changelog.histories[1].created = "2018-01-02";
            exampleIssue.changelog.histories[1].items = [
                statusHistoryItem({ from: "2", fromString: DOING.name, to: "3", toString: DONE_STATUS.name })
            ];

            const timings = Jira.getIssueTimings(exampleIssue, [DONE_STATUS]);

            expect(timings.times.doing).toBe(A_DAY_IN_MILLIS);
        });

        it("should handle data correctly if histories are newest-first", () => {
            const DONE_STATUS = { name: "finish", isDone: true };
            const DOING = { name: "doing", isDone: false };
            const TODO = { name: "todo", isDone: false };

            exampleIssue.changelog.histories[0].created = "2018-01-02";
            exampleIssue.changelog.histories[0].items = [
                statusHistoryItem({ from: "2", fromString: DOING.name, to: "3", toString: DONE_STATUS.name })
            ];

            exampleIssue.changelog.histories[1].created = "2018-01-01";
            exampleIssue.changelog.histories[1].items = [
                statusHistoryItem({ from: "1", fromString: TODO.name, to: "2", toString: DOING.name })
            ];

            const timings = Jira.getIssueTimings(exampleIssue, [DONE_STATUS]);

            expect(timings.times.doing).toBe(A_DAY_IN_MILLIS);
        });
    });
});
