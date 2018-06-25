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

import yargs from "yargs";
import fs from "fs";
import path from "path";
import { Config, Script, Argv, ConfigJson } from "./lib/interfaces";
import { isString } from "util";
const PROJECT_CONF_REGEX = /^config\.project\.(.*)\.json$/;

namespace runner {
    function readdir(path = __dirname): Promise<string[]> {
        return new Promise<string[]>((resolve, reject) => {
            fs.readdir(path, (err, files) => {
                if (err) reject(err);
                else resolve(files);
            });
        });
    }

    async function getProjectNames() {
        return (await readdir())
            .filter(filename => filename.match(PROJECT_CONF_REGEX) !== null)
            .map(filename => path.basename(filename))
            .map(basename => basename.match(PROJECT_CONF_REGEX)[1]);
    }
    async function getScriptNames() {
        return (await readdir(__dirname + "/scripts")).map(filename => path.basename(filename, path.extname(filename)));
    }

    export function removeThisScriptArguments(argv: Argv): Argv {
        const newScriptArgv: Argv = JSON.parse(JSON.stringify(argv));
        const scriptName = newScriptArgv._.shift();
        newScriptArgv.$0 = scriptName;
        delete newScriptArgv.project;
        return newScriptArgv;
    }

    function convertJsonToConfig(configJson: ConfigJson): Config {
        const config = JSON.parse(JSON.stringify(configJson));
        config.statuses = configJson.statuses.map(name => (isString(name) ? { name } : name));
        return config;
    }

    function showHint(heading1: string, heading2: string, items: string[]) {
        console.error(heading1);
        console.error(heading2);
        items.forEach(name => console.error(`- ${name}`));
        console.error();
    }

    async function showProjectsHint(heading: string) {
        showHint(heading, "Available projects:", await getProjectNames());
    }

    async function showScriptsHint(heading: string) {
        showHint(heading, "Available scripts:", await getScriptNames());
    }

    export async function run(argv: Argv) {
        const scriptName = argv._[0];
        const projectName = argv.project;
        let config: Config;
        let scriptModule: { default: Script };

        let error = false;
        if (projectName) {
            try {
                config = convertJsonToConfig(await import(`./config.project.${projectName}.json`));
            } catch (e) {
                if (e instanceof Error && e.message.startsWith("Cannot find module")) {
                    await showProjectsHint("No such project: " + projectName);
                    error = true;
                } else throw e;
            }
        } else {
            await showProjectsHint("You need to give the --project parameter");
            error = true;
        }

        if (scriptName) {
            try {
                scriptModule = await import(`./scripts/${scriptName}`);
            } catch (e) {
                if (e instanceof Error && e.message.startsWith("Cannot find module")) {
                    await showScriptsHint("No such script: " + scriptName);
                    error = true;
                } else throw e;
            }
        } else {
            await showScriptsHint("You need to define which script to run");
            error = true;
        }

        if (error) {
            console.error("Syntax:");
            console.error("run --project=<project> <script> <<script parameters>>");
            process.exit(1);
        }

        try {
            await scriptModule.default(config, removeThisScriptArguments(argv));
        } catch (e) {
            throw e;
        }
    }
}

export = runner;

const argv = yargs.argv;
if (argv.$0 === path.basename(__filename)) {
    (async () => {
        runner.run(argv);
    })();
}
