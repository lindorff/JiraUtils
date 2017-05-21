"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t;
    return { next: verb(0), "throw": verb(1), "return": verb(2) };
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var request = require("request-promise-native");
function timesInStatusesForTicket(key, auth, finalStatuses) {
    return __awaiter(this, void 0, void 0, function () {
        var issueDetails, _a, _b, _c, issueCreatedDate, statusChangeHistories, doneTime, prevStatus, prevStatusStartTime, timeInStatuses, secondsInPreviousStatus;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _b = (_a = JSON).parse;
                    return [4 /*yield*/, request("https://jira.lindorff.com/rest/api/2/issue/" + key + "?expand=changelog", { auth: auth })];
                case 1:
                    issueDetails = _b.apply(_a, [_d.sent()]);
                    issueCreatedDate = new Date(issueDetails.fields.created);
                    if (issueDetails.changelog.maxResults < issueDetails.changelog.total) {
                        throw new Error(key + " has more changelog events than what we can process with the current Jira API (Got " + issueDetails.changelog.maxResults + " event(s), but it has " + issueDetails.changelog.total);
                    }
                    statusChangeHistories = issueDetails.changelog.histories.filter(function (history) {
                        var statusItem = history.items.find(function (item) { return item.field === 'status'; });
                        return statusItem !== undefined
                            && statusItem.from != null
                            && statusItem.to != null
                            && statusItem.from !== statusItem.to;
                    });
                    doneTime = null;
                    prevStatus = null;
                    prevStatusStartTime = issueCreatedDate;
                    timeInStatuses = {};
                    statusChangeHistories.forEach(function (statusChangeHistory) {
                        /* There shouldn't be many status changes in one history entry,
                         * but just in case, we'll take the last one */
                        var statusChange = statusChangeHistory.items
                            .reverse()
                            .find(function (item) { return item.field === 'status'; });
                        var newStatusStartTime = new Date(statusChangeHistory.created);
                        var newStatus = statusChange.toString.toLowerCase();
                        var secondsInPreviousStatus = newStatusStartTime.getTime() - prevStatusStartTime.getTime();
                        if (prevStatus === null)
                            prevStatus = statusChange.fromString.toLowerCase();
                        if (!timeInStatuses[prevStatus])
                            timeInStatuses[prevStatus] = 0;
                        timeInStatuses[prevStatus] += secondsInPreviousStatus;
                        prevStatus = newStatus;
                        prevStatusStartTime = newStatusStartTime;
                        if (finalStatuses.indexOf(newStatus) >= 0)
                            doneTime = newStatusStartTime;
                    });
                    secondsInPreviousStatus = new Date().getTime() - prevStatusStartTime.getTime();
                    if (!timeInStatuses[prevStatus])
                        timeInStatuses[prevStatus] = 0;
                    timeInStatuses[prevStatus] += secondsInPreviousStatus;
                    return [2 /*return*/, {
                            key: key,
                            created: issueCreatedDate,
                            finished: doneTime,
                            times: timeInStatuses
                        }];
            }
        });
    });
}
exports.timesInStatusesForTicket = timesInStatusesForTicket;
;
function getKeysInJQL(jql, auth) {
    return __awaiter(this, void 0, void 0, function () {
        var issues, uri, hasMorePages, startAt, result, _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    issues = [];
                    uri = "https://jira.lindorff.com/rest/api/2/search?jql=" + jql;
                    hasMorePages = false;
                    startAt = 0;
                    console.log("Fetching all results from URI " + uri);
                    _d.label = 1;
                case 1:
                    _b = (_a = JSON).parse;
                    return [4 /*yield*/, request(uri + "&startAt=" + startAt, { auth: auth })];
                case 2:
                    result = _b.apply(_a, [_d.sent()]);
                    console.log("Got " + result.startAt + ".." + (result.startAt + result.maxResults) + "/" + result.total);
                    result.issues.forEach(function (issue) { return issues.push(issue.key); });
                    hasMorePages = (result.startAt + result.maxResults) < (result.total);
                    startAt = result.startAt + result.maxResults;
                    _d.label = 3;
                case 3:
                    if (hasMorePages) return [3 /*break*/, 1];
                    _d.label = 4;
                case 4:
                    console.log('Done fetching');
                    console.log();
                    return [2 /*return*/, issues];
            }
        });
    });
}
exports.getKeysInJQL = getKeysInJQL;
