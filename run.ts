import yargs from "yargs";
import fs from "fs";
import path from "path";
import { Config, Script, Argv } from "./lib/interfaces";
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
    sanitizedArgv._.shift();
    delete sanitizedArgv.project;
    return sanitizedArgv;
}

(async () => {
    const scriptName = argv._[0];
    const projectName = argv.project;

    const errors: string[] = [];
    if (!projectName) errors.push("You need to give the --project parameter");
    if (!scriptName) errors.push("You need to define which script to run");

    if (errors.length > 0) {
        errors.forEach(error => console.error(error));
        process.exit(1);
    }

    let config: Config;
    try {
        config = <Config>await import(`./config.project.${projectName}.json`);
    } catch (e) {
        if (e instanceof Error && e.message.startsWith("Cannot find module")) {
            console.error("No such project: " + projectName);
            console.error("Try one of the following:");
            (await getProjectNames()).forEach(name => console.error(name));
            process.exit(1);
        } else throw e;
    }

    try {
        const mod: { default: Script } = await import(`./scripts/${scriptName}`);
        await mod.default(config, getSanitizedArgv(argv));
    } catch (e) {
        if (e instanceof Error && e.message.startsWith("Cannot find module")) {
            console.log(e.message);
            console.log("Try one of these:");
            (await getScriptNames()).forEach(file => console.log(`- ${file}`));
            process.exit(1);
        } else throw e;
    }
})();
