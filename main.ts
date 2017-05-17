import { timesInStatusesForTickets } from './lib';

process.argv.shift();
process.argv.shift();
const keys = process.argv;

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


if (keys.length === 0) {
    console.error('No keys given');
    process.exit(1);
} else {
    console.log(`Key,${statuses.join(',')}`);
    keys.forEach(async key => {
        const times = await timesInStatusesForTickets(key);
        console.log(`${key},${prettyPrint(times.times, statuses)}`);
    });
}
