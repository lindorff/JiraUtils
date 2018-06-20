import { Argv } from "../lib/interfaces";
import runner from "../_run";
import { expect } from "chai";
import "mocha";

describe("runner", () => {
    describe("removeThisScriptArguments", () => {
        it("should strip the original script's arguments", () => {
            const argv: Argv = { $0: "run", project: "project", _: ["child-script"] };
            const scriptArgv = runner.removeThisScriptArguments(argv);

            expect(scriptArgv.$0).to.equal("child-script");
            expect(scriptArgv._).to.be.empty;
            expect(scriptArgv.project).to.be.undefined;
        });
    });
});
