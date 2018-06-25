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

const CONFIG_FILES = fs.readdirSync(__dirname).filter(filename => filename.endsWith(".json.example"));

try {
    CONFIG_FILES.forEach(configFile => {
        const targetFile = configFile.substring(0, configFile.length - ".example".length);
        process.stdout.write(`${configFile} ... `);
        if (!fs.existsSync(targetFile)) {
            process.stdout.write(`writing ${targetFile} ... `);
            fs.createReadStream(configFile).pipe(fs.createWriteStream(targetFile));
            process.stdout.write(`ok!`);
        } else {
            process.stdout.write(`${targetFile} exists already, skipping.`);
        }
        process.stdout.write("\n");
    });
} catch (e) {
    console.error("\n");
    console.error(e);
}
