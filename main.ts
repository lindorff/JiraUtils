import { timesInStatusesForTicket, getKeysInJQL } from './lib';
import * as yargs from 'yargs';

const argv = yargs.argv;

let keys: string[] = [];
let query = null;

if (argv.query) {
    query = argv.query;
} else {
    keys = argv._;
}

const statuses = [
    'Idea',
    'Gathering Requirements',
    'Ready for development',
    'In Development',
    'To Approve',
    'In Approval',
    'Done',
    'Archived',
    'Invalid'
];

function prettyPrintTimes(values: { [key: string]: number }, statuses: string[]): string {
    return statuses
        .map(s => values[s] || 0)
        .join(',');
}

function prettyPrintDate(date:Date):string {
    return `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`;
}

function prettyPrintAllTickets(keys: string[]) {
    console.log(`Key,Created,Finished,${statuses.join(',')}`);
    keys.forEach(async key => {
        const times = await timesInStatusesForTicket(key);
        console.log(`${key},${prettyPrintDate(times.created)},${prettyPrintDate(times.finished)},${prettyPrintTimes(times.times, statuses)}`);
    });

}

(async () => {
    if (query) {
        keys = await getKeysInJQL(query);
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
