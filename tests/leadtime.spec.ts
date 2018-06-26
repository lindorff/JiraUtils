import "mocha";
import { expect } from "chai";
import script from "../scripts/leadtime";

describe("leadtime", () => {
    describe("getIssueTimeStrings", () => {
        it("shows the appropriate headers (without summary)", () => {
            const outputLines = script.getIssueTimeStrings([], [], [], false);
            const header = outputLines[0];
            expect(header).to.equal("Key,Created,Finished,");
        });

        it("shows the appropriate headers (with summary)", () => {
            const outputLines = script.getIssueTimeStrings([], [], [], true);
            const header = outputLines[0];
            expect(header).to.equal("Key,Summary,Created,Finished,");
        });
    });
});
