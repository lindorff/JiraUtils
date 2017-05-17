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

function prettyPrint(values: { [key: string]: number }, statuses: string[]): string {
    return statuses
        .map(s => values[s] || 0)
        .join(',');
}

function prettyPrintAllTickets(keys: string[]) {
    console.log(`Key,${statuses.join(',')}`);
    keys.forEach(async key => {
        const times = await timesInStatusesForTicket(key);
        console.log(`${key},${prettyPrint(times.times, statuses)}`);
    });

}

(async () => {
    if (query) {
        keys = await getKeysInJQL(query);
    }

    if (keys.length > 0) {
        prettyPrintAllTickets(keys);
    } else {
        console.error('give a query or ticket numbers');
        process.exit(1);
    }
})();
