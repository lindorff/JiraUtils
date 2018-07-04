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
import { Config, Script, Argv, ConfigJson, JiraConfig, ProjectConfig } from "./lib/interfaces";
import { isString } from "util";
import { validate as validateJsonSchema, ValidationError } from "jsonschema";
const PROJECT_CONF_REGEX = /^config\.project\.(.*)\.json$/;

const ANSI_RED = "\u001b[31;1m";
const ANSI_YELLOW_BRIGHT = "\u001b[33;1m";
const ANSI_RESET = "\u001b[0m";

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

    function showHint(heading1: string, heading2: string, items: string[]) {
        console.error(ANSI_YELLOW_BRIGHT + heading1 + ANSI_RESET);
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

    function printJsonSchemaErrors(filename: string, errors: ValidationError[]): void {
        const errorLines = errors.map(error => `- ${error.property} ${error.message}`);
        const file = path.relative(__dirname, filename);
        const s = errorLines.length > 1 ? "s" : "";
        console.error(
            `${ANSI_YELLOW_BRIGHT}⚠ ` +
                `${ANSI_RED}The file ${file} has the following formatting error${s}:` +
                ANSI_RESET
        );
        errorLines.forEach(line => console.error(ANSI_RED + line + ANSI_RESET));
        console.error();
    }

    async function getValidatedJson<T>(
        jsonFilename: string,
        schemaFilename: string,
        noSuchFileCB: () => any
    ): Promise<T> {
        try {
            async function safeJsonImport<T>(jsonFile: string): Promise<T> {
                const jsonModule = await import(jsonFile);

                // clone the json module so we don't modify the cached object
                const safeClone = JSON.parse(JSON.stringify(jsonModule));

                // TS creates the default property automatically, but
                // 1) we don't need it, and
                // 2) it messes up the validation
                delete (<any>safeClone).default;
                return safeClone;
            }

            const schema: any = await safeJsonImport<any>(schemaFilename);
            const json: T = await safeJsonImport<T>(jsonFilename);

            const validatorResult = validateJsonSchema(json, schema);
            if (validatorResult.errors.length === 0) {
                return json;
            } else {
                printJsonSchemaErrors(jsonFilename, validatorResult.errors);
                return null;
            }
        } catch (e) {
            if (e instanceof Error && e.message.startsWith("Cannot find module")) {
                await noSuchFileCB();
                return null;
            } else throw e;
        }
    }

    async function getJiraConfig(): Promise<JiraConfig> {
        return await getValidatedJson<JiraConfig>("./config.jira.json", "./_schema.jira.json", () =>
            console.error(`${ANSI_YELLOW_BRIGHT}⚠ ${ANSI_RED}config.jira.json not found${ANSI_RESET}\n`)
        );
    }

    async function getProjectConfig(name: string): Promise<ProjectConfig> {
        const json = await getValidatedJson<ConfigJson>(
            `./config.project.${name}.json`,
            "./_schema.project.json",
            async () => await showProjectsHint("No such project: " + name)
        );
        if (json) json.statuses = json.statuses.map(name => (isString(name) ? { name } : name));
        return <ProjectConfig>json;
    }

    export async function run(argv: Argv) {
        const scriptName = argv._[0];
        const projectName = argv.project;
        const jiraConfig = await getJiraConfig();
        let projectConfig: ProjectConfig;
        let scriptModule: { default: Script };

        let error = false;
        if (projectName) {
            projectConfig = await getProjectConfig(projectName);
            if (projectConfig === null) error = true;
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
            console.error(ANSI_YELLOW_BRIGHT + "Syntax:" + ANSI_RESET);
            console.error("run --project=<project> <script> <<script parameters>>");
            process.exit(1);
        }

        try {
            const config: Config = { jira: jiraConfig, project: projectConfig };
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
