import { timesInStatusesForTickets } from './lib';

process.argv.shift();
process.argv.shift();
const keys = process.argv;

if (keys.length === 0) {
    console.error('No keys given');
    process.exit(1);
} else {
    console.log('Key,Idea,Gathering Requirements,Ready for development,In Development,To Approve,In Approval,Done,Archived,Invalid');
    keys.forEach(timesInStatusesForTickets);
}
