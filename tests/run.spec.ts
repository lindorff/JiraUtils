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
