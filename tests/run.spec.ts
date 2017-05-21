/// <reference path="../node_modules/@types/mocha/index.d.ts" />
import * as os from 'os'
import * as path from 'path'
import { execFile, ChildProcess, ExecOptionsWithStringEncoding } from 'child_process'
import { expect, assert } from 'chai'

interface ExecOutput {
    stderr: string,
    stdout: string
}

const opts: ExecOptionsWithStringEncoding = {
    encoding: 'utf8',
    cwd: path.resolve(__dirname, '..')
}

const scriptName = "run.bat";

console.log(`pwd is ${opts.cwd}`);

async function execRunBatch(...args:string[]): Promise<ExecOutput> {
    return new Promise<ExecOutput>((resolve, reject) => {
        execFile(scriptName, args, opts, (error: Error, stdout: string, stderr: string) => {
            if (error) {
                reject(error);
            } else {
                resolve({
                    stderr: stderr,
                    stdout: stdout
                })
            }
        });
    });
}

describe('Running the script', () => {
    it('should run successfully without arguments', async () => {
        try {
            const output = await execRunBatch();
            expect(output.stderr).is.empty;
            expect(output.stdout).is.not.empty;
        } catch (e) {
            if (e.code === 'ENOENT') {
                assert.fail(0, 1, `script not found: ${scriptName}`);
            } else {
                throw e;
            }
        }
    });

    it('should show any status given in --status', async () => {
        const statusName = 'foo';
        const output = await execRunBatch(`--statuses=${statusName}`, 'pay-4145');
        expect(output.stdout).to.contain(`Key,Created,Finished,${statusName}`);
    });
})
