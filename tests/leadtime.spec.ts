import "mocha";
import { expect } from "chai";
import script from "../scripts/leadtime";

describe("leadtime", () => {
    describe("getIssueTimeStrings", () => {
        it("shows the appropriate headers, without summary, without statuses", () => {
            const outputLines = script.getIssueTimeStrings([], [], [], false);
            const header = outputLines[0];
            expect(header).to.equal("Key,Created,Finished");
        });

        it("shows the appropriate headers, without summary, with statuses", () => {
            const outputLines = script.getIssueTimeStrings([], ["foo", "bar"], [], false);
            const header = outputLines[0];
            expect(header).to.equal("Key,Created,Finished,foo,bar");
        });

        it("shows the appropriate headers, with summary, without statuses", () => {
            const outputLines = script.getIssueTimeStrings([], [], [], true);
            const header = outputLines[0];
            expect(header).to.equal("Key,Summary,Created,Finished");
        });

        it("shows the appropriate headers, with summary, with statuses", () => {
            const outputLines = script.getIssueTimeStrings([], ["foo", "bar"], [], true);
            const header = outputLines[0];
            expect(header).to.equal("Key,Summary,Created,Finished,foo,bar");
        });
    });
});
