export interface User {
    displayName: string;
    key: string;
    active: boolean;
    [key: string]: any;
}

export interface HistoryItem {
    field: string;
    fieldtype: string;
    from: string;
    fromString: string;
    to: string;
    toString: string;
}

export interface History {
    /** e.g. 2017-05-08T10:43:21.000+0000 */
    created: string;
    id: string;
    author: User;
    items: HistoryItem[];
}

export interface HistoryListing {
    self: string;
    nextPage: string;
    maxResults: number;
    startAt: number;
    total: number;
    isLast: boolean;
    values: History[];
}

export interface Issue {
    /** e.g. 2017-05-08T10:43:21.000+0000 */
    resolutiondate: string;
    expand: string;
    id: string;
    self: string;
    key: string;
    fields: {
        created: string;
        subtasks: Issue[];
        summary: string;
        [key: string]: any;
    };
    changelog?: {
        maxResults: number;
        startAt: number;
        total: number;
        histories: History[];
    };
}

export interface IssueQueryResponse {
    expand: string;
    startAt: number;
    maxResults: number;
    total: number;
    issues: Issue[];
}

export interface JiraAuth {
    user: string;
    pass: string;
}

export interface Config {
    jira: JiraAuth;
    statuses: string[];
    showSummary: boolean;
}

export interface TicketInfo {
    key: string;
    summary: string;
    created: Date;
    finished?: Date;
    times: {
        [statusName: string]: number;
    };
}
