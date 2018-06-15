import yargs from "yargs";
import fs from "fs";
import path from "path";
import { Config, Script, Argv, ConfigJson } from "./lib/interfaces";
import { isString } from "util";
const argv: Argv = yargs.argv;
const PROJECT_CONF_REGEX = /^config\.project\.(.*)\.json$/;

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

function getSanitizedArgv(argv: Argv) {
    const sanitizedArgv: Argv = JSON.parse(JSON.stringify(argv));
    const script = sanitizedArgv._.shift();
    sanitizedArgv.$0 = script;
    delete sanitizedArgv.project;
    return sanitizedArgv;
}

function convertConfig(configJson: ConfigJson): Config {
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

(async () => {
    const scriptName = argv._[0];
    const projectName = argv.project;
    let config: Config;
    let mod: { default: Script };

    let error = false;
    if (projectName) {
        try {
            config = convertConfig(await import(`./config.project.${projectName}.json`));
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
            mod = await import(`./scripts/${scriptName}`);
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
        await mod.default(config, getSanitizedArgv(argv));
    } catch (e) {
        throw e;
    }
})();
