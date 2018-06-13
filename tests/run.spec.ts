import * as path from "path";
import * as fs from "fs";
import { exec, ExecOptionsWithStringEncoding } from "child_process";
import { expect, assert } from "chai";
import "mocha";

interface ExecOutput {
    stderr: string;
    stdout: string;
}

const opts: ExecOptionsWithStringEncoding = {
    encoding: "utf8",
    cwd: path.resolve(__dirname, ".."),
    timeout: 0
};

const scriptName = "run.bat";
const ARBITRARY_TICKET_KEY_1 = "PAY-4145";
const ARBITRARY_TICKET_KEY_2 = "PAY-4206";

console.log(`pwd is ${opts.cwd}`);

async function execRunBatch(...args: string[]): Promise<ExecOutput> {
    return new Promise<ExecOutput>((resolve, reject) => {
        // this needs to be "exec" since "execFile" terminates too early on JQL for some weird reason...
        exec(`${scriptName} ${args.join(" ")}`, opts, (error: Error, stdout: string, stderr: string) => {
            if (error) {
                reject(error);
            } else {
                resolve({
                    stderr: stderr,
                    stdout: stdout
                });
            }
        });
    });
}

describe("Running the script", function() {
    this.slow(2500);
    this.timeout(5000);

    it("should run successfully without arguments", async () => {
        try {
            const output = await execRunBatch();
            expect(output.stderr).is.empty;
            expect(output.stdout).is.not.empty;
        } catch (e) {
            if (e.code === "ENOENT") {
                assert.fail(0, 1, `script not found: ${scriptName}`);
            } else {
                throw e;
            }
        }
    });

    it("should support giving one key as a parameter", async () => {
        const output = await execRunBatch(ARBITRARY_TICKET_KEY_1);
        expect(output.stdout).to.contain(`${ARBITRARY_TICKET_KEY_1},2017-`);
    });

    it("should support giving many keys as a parameter", async () => {
        const output = await execRunBatch(ARBITRARY_TICKET_KEY_1, ARBITRARY_TICKET_KEY_2);
        expect(output.stdout).to.contain(`${ARBITRARY_TICKET_KEY_1},2017-`);
        expect(output.stdout).to.contain(`${ARBITRARY_TICKET_KEY_2},2017-`);
    });

    it("should support fetching tickets with JQL", async () => {
        const output = await execRunBatch(`--query="key=${ARBITRARY_TICKET_KEY_1}"`);
        expect(output.stdout).to.contain(`${ARBITRARY_TICKET_KEY_1},2017-`);
    });

    it("should show any status given through command line", async () => {
        const statusName = "foo";
        const output = await execRunBatch(`--statuses=${statusName}`, ARBITRARY_TICKET_KEY_1);
        expect(output.stdout).to.contain(`Key,Created,Finished,${statusName}`);
    });

    it("should be able to write output to a file", async () => {
        const fileName = `test-output-${Date.now() % 1000}.txt`;
        await execRunBatch(`--file=${fileName}`, ARBITRARY_TICKET_KEY_1);
        expect(fs.existsSync(fileName));
        fs.unlinkSync(fileName);
    });
});
