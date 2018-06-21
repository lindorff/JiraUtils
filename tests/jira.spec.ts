import { expect } from "chai";
import "mocha";
import { Issue, HasChangelog, HistoryItem } from "../lib/interfaces";
import { getIssueStatusEvents, returnKeyIfCompletedDuringTheDate } from "../lib/jira";

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

function statusHistoryItem(partial: any): HistoryItem {
    const statusHistoryItem = { field: "status", fieldtype: "jira" };
    return historyItem(Object.assign(statusHistoryItem, partial));
}

describe("Jira", () => {
    let exampleIssue: Issue & HasChangelog = null;
    beforeEach(async () => {
        exampleIssue = <any>await import("./ABC-1.json");
    });

    describe("getIssueStatusEvents", () => {
        it("should find a status item", () => {
            exampleIssue.changelog.histories[0].items = [historyItem({ field: "status", from: "0", to: "1" })];

            const statusEvents = getIssueStatusEvents(exampleIssue);
            expect(statusEvents).to.have.lengthOf(1);
            expect(statusEvents[0].items).to.have.lengthOf(1);

            const item = statusEvents[0].items[0];
            expect(item.from).to.equal("0");
            expect(item.to).to.equal("1");
        });

        it("should find many status items", () => {
            exampleIssue.changelog.histories[0].items = [
                historyItem({ field: "status", from: "0", to: "1" }),
                historyItem({ field: "status", from: "2", to: "3" })
            ];

            const statusEvents = getIssueStatusEvents(exampleIssue);
            expect(statusEvents).to.have.lengthOf(1);
            expect(statusEvents[0].items).to.have.lengthOf(2);

            const item1 = statusEvents[0].items[0];
            expect(item1.from).to.equal("0");
            expect(item1.to).to.equal("1");

            const item2 = statusEvents[0].items[1];
            expect(item2.from).to.equal("2");
            expect(item2.to).to.equal("3");
        });

        it("should discard any non-status items", () => {
            exampleIssue.changelog.histories[0].items = [historyItem({ field: "foo", from: "0", to: "1" })];

            const statusEvents = getIssueStatusEvents(exampleIssue);
            expect(statusEvents).to.have.lengthOf(0);
        });

        it("should discard any status items without to/from fields", () => {
            exampleIssue.changelog.histories[0].items = [historyItem({ field: "status" })];

            const statusEvents = getIssueStatusEvents(exampleIssue);
            expect(statusEvents).to.have.lengthOf(0);
        });

        it("should discard any status items with the same to and from fields", () => {
            exampleIssue.changelog.histories[0].items = [historyItem({ field: "status", from: "0", to: "0" })];

            const statusEvents = getIssueStatusEvents(exampleIssue);
            expect(statusEvents).to.have.lengthOf(0);
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

            const key = returnKeyIfCompletedDuringTheDate(exampleIssue, ["finish"], from, to);
            expect(key).to.equal("ABC-1");
        });

        it("should return null if the issue is completed before the date interval", () => {
            exampleIssue.key = "ABC-1";
            exampleIssue.changelog.histories[0].created = "2017-01-01T09:00:00.000+0000";
            exampleIssue.changelog.histories[0].items = [
                statusHistoryItem({ from: "0", fromString: "start", to: "1", toString: "finish" })
            ];
            const from = new Date("2017-01-02");
            const to = new Date("2017-01-03");

            const key = returnKeyIfCompletedDuringTheDate(exampleIssue, ["finish"], from, to);
            expect(key).to.be.null;
        });

        it("should return null if the issue is completed after the date interval", () => {
            exampleIssue.key = "ABC-1";
            exampleIssue.changelog.histories[0].created = "2017-01-04T09:00:00.000+0000";
            exampleIssue.changelog.histories[0].items = [
                statusHistoryItem({ from: "0", fromString: "start", to: "1", toString: "finish" })
            ];
            const from = new Date("2017-01-02");
            const to = new Date("2017-01-03");

            const key = returnKeyIfCompletedDuringTheDate(exampleIssue, ["finish"], from, to);
            expect(key).to.be.null;
        });
    });
});
