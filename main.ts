import { timesInStatusesForTicket, getKeysInJQL } from './lib/lib';
import { Config } from './lib/interfaces';
import * as yargs from 'yargs';
const config = <Config>require('./config.json');

const argv = yargs.argv;

let keys: string[] = [];
let query = null;

if (argv.query) {
    query = argv.query;
} else {
    keys = argv._;
}

function prettyPrintTimes(values: { [key: string]: number }, statuses: string[]): string {
    return statuses
        .map(s => values[s] || 0)
        .join(',');
}

function prettyPrintDate(date: Date): string {
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function prettyPrintAllTickets(keys: string[]) {
    console.log(`Key,Created,Finished,${config.statuses.join(',')}`);
    keys.forEach(async key => {
        const times = await timesInStatusesForTicket(key, config.jira);
        console.log(`${key},${prettyPrintDate(times.created)},${prettyPrintDate(times.finished)},${prettyPrintTimes(times.times, config.statuses)}`);
    });

}

(async () => {
    if (query) {
        keys = await getKeysInJQL(query, config.jira);
    }

    if (keys.length > 0) {
        prettyPrintAllTickets(keys);
    } else {
        console.log('run [--query=JQL|KEY1 [KEY2 [...]]]');
        console.log();
        console.log('Example: run --query="project in (br,pay) and status = done"');
        console.log('Example: run br-1 pay-1');
        process.exit(1);
    }
})();
