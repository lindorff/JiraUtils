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
