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

import * as fs from "fs";

function initJiraConfig() {
    const FILE = "config.jira.json";
    const FILE_EXAMPLE = FILE + ".example";
    if (fs.existsSync(FILE)) return;
    if (!fs.existsSync(FILE_EXAMPLE))
        throw new Error(FILE_EXAMPLE + " was not found. Try downloading this script again?");

    process.stdout.write(`Writing ${FILE} ... `);
    fs.createReadStream(FILE_EXAMPLE).pipe(fs.createWriteStream(FILE));
    process.stdout.write(`ok!\n`);
}

function initProjectConfig() {
    const FILE = "config.project._.json";
    const FILE_EXAMPLE = FILE + ".example";
    const REGEX = /^config\.project\.[^.]+\.json$/;
    const someProjectFileExistsAlready = fs.readdirSync(__dirname).filter(filename => filename.match(REGEX)).length > 0;
    if (someProjectFileExistsAlready) return;
    if (!fs.existsSync(FILE_EXAMPLE))
        throw new Error(FILE_EXAMPLE + " was not found. Try downloading this script again?");

    process.stdout.write(`Writing ${FILE} ... `);
    fs.createReadStream(FILE_EXAMPLE).pipe(fs.createWriteStream(FILE));
    process.stdout.write(`ok!\n`);
    console.log("Remember to rename config.project._.json to something like config.project.myProject.json");
}

try {
    initJiraConfig();
    initProjectConfig();
} catch (e) {
    console.error("\n");
    console.error(e);
}
