import * as request from 'request-promise-native';
import { Issue, Status, HistoryItem } from './interfaces';
import fs = require('fs');
const auth = require('./config.json');

const opts: request.RequestPromiseOptions = {
    auth: auth
};

// FIXME: this can be removed by just checking the first "from" value in the status.
const INITIAL_STATUS = 'Idea';

export interface TicketStatusTimes {
    key: string,
    times: {
        [statusName: string]: number
    }
}

export async function timesInStatusesForTickets(key: string): Promise<TicketStatusTimes> {
    const issueDetails = <Issue>JSON.parse(await request(`https://jira.lindorff.com/rest/api/2/issue/${key}?expand=changelog`, opts));

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

    return {
        key: key,
        times: timeInStatuses
    }
};
