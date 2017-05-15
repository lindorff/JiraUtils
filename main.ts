import * as request from 'request-promise-native';
import { Issue, Status, HistoryItem } from './interfaces';
import fs = require('fs');
const auth = require('./config.json');

const opts: request.RequestPromiseOptions = {
    auth: auth
};

const INITIAL_STATUS = 'Idea';


process.argv.shift();
process.argv.shift();
const keys = process.argv;

async function leadForTicket(key:string) {
    const issueDetails = <Issue>JSON.parse(await request(`https://jira.lindorff.com/rest/api/2/issue/${key}?expand=changelog`, opts));
    fs.writeFile('result.json', JSON.stringify(issueDetails), { encoding: 'utf-8' }, e => {
        if (e) throw e;
    });

    if (issueDetails.changelog.maxResults < issueDetails.changelog.total) {
        throw new Error(`${key} has more changelog events than what we can process with the current Jira API (Got ${issueDetails.changelog.maxResults} event(s), but it has ${issueDetails.changelog.total}`);
    }

    const statusChangeHistories = issueDetails.changelog.histories.filter(history => {
        const statusItem = history.items.find(item => item.field === 'status')
        return statusItem !== undefined
            && statusItem.from != null
            && statusItem.to != null
            && statusItem.from !== statusItem.to;
    })

    let prevStatus = INITIAL_STATUS;
    let prevStatusStartTime = new Date(issueDetails.fields.created);
    const timeInStatuses: { [status: string]: number } = {};

    statusChangeHistories.forEach(statusChangeHistory => {

        /* There shouldn't be many status changes in one history entry, 
         * but just in case, we'll take the last one */
        const statusChange = statusChangeHistory.items
            .reverse()
            .find(item => item.field === 'status');

        const newStatusStartTime = new Date(statusChangeHistory.created);
        const newStatus = statusChange.toString;
        const secondsInPreviousStatus = newStatusStartTime.getTime() - prevStatusStartTime.getTime();

        if (!timeInStatuses[prevStatus]) timeInStatuses[prevStatus] = 0;
        timeInStatuses[prevStatus] += secondsInPreviousStatus;

        prevStatus = newStatus;
        prevStatusStartTime = newStatusStartTime;
    });

    const secondsInPreviousStatus = new Date().getTime() - prevStatusStartTime.getTime();
    if (!timeInStatuses[prevStatus]) timeInStatuses[prevStatus] = 0;
    timeInStatuses[prevStatus] += secondsInPreviousStatus;

    const pp = function (s){return timeInStatuses[s]||0};
    console.log(`${key},${pp('Idea')},${pp('Gathering Requirements')},${pp('Ready for development')},${pp('In Development')},${pp('To Approve')},${pp('In Approval')},${pp('Done')},${pp('Archived')},${pp('Invalid')}`);
};


if (keys.length === 0) {
    console.error('No keys given');
    process.exit(1);
} else {
    console.log('Key,Idea,Gathering Requirements,Ready for development,In Development,To Approve,In Approval,Done,Archived,Invalid');
    keys.forEach(leadForTicket);
}
