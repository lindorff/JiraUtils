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

export interface HasChangelog {
    changelog: {
        maxResults: number;
        startAt: number;
        total: number;
        histories: History[];
    };
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
}

export interface IssueQueryResponse {
    expand: string;
    startAt: number;
    maxResults: number;
    total: number;
    issues: Issue[];
}

export interface JiraConfig {
    user: string;
    pass: string;
    url: string;
}

export interface IssueTimings {
    key: string;
    summary: string;
    created: Date;
    finished?: Date;
    times: {
        [statusName: string]: number;
    };
}

export interface Config {
    jira: JiraConfig;
    project: ProjectConfig;
}

export interface ConfigJson extends ConfigBase {
    statuses: (string | { name: string; isDone?: boolean })[];
}

export interface ProjectConfig extends ConfigBase {
    statuses: { name: string; isDone?: boolean }[];
}

interface ConfigBase {
    statuses: any;
    scripts: {
        donetickets: { types: string[] };
        leadtime: { showSummary?: boolean };
        storypoints: {
            propertyName: {
                jqlName: string;
                apiName: string;
            };
            types: string[];
            ignoreStatuses: string[];
            output?: string;
        };
    };
    project: string;
}

export interface Argv {
    _: string[];
    $0: string;
    [arg: string]: any;
}

export type Script = (config: Config, argv: Argv) => Promise<any>;
