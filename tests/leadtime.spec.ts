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

import script from "../scripts/leadtime";
import { Status } from "../lib/interfaces";
import { StatusHelper } from "./statusHelper";

const toStatus = StatusHelper.toStatus;

describe("leadtime", () => {
    describe("getIssueTimeStrings", () => {
        it("shows the appropriate headers, without summary, without statuses", () => {
            const outputLines = script.getIssueTimeStrings([], [], false);
            const header = outputLines[0];
            expect(header).toBe("Key,Created,Finished");
        });

        it("shows the appropriate headers, without summary, with statuses", () => {
            const outputLines = script.getIssueTimeStrings([], [toStatus("foo"), toStatus("bar")], false);
            const header = outputLines[0];
            expect(header).toBe("Key,Created,Finished,foo,bar");
        });

        it("shows the appropriate headers, with summary, without statuses", () => {
            const outputLines = script.getIssueTimeStrings([], [], true);
            const header = outputLines[0];
            expect(header).toBe("Key,Summary,Created,Finished");
        });

        it("shows the appropriate headers, with summary, with statuses", () => {
            const outputLines = script.getIssueTimeStrings([], [toStatus("foo"), toStatus("bar")], true);
            const header = outputLines[0];
            expect(header).toBe("Key,Summary,Created,Finished,foo,bar");
        });
    });
});
