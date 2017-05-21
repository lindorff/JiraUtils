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
var _this = this;
exports.__esModule = true;
var lib_1 = require("./lib/lib");
var fs = require("fs");
var os = require("os");
var path = require("path");
var yargs = require("yargs");
var config = (function () {
    var tryFiles = Array
        .from(new Set([
        process.cwd() + '/config.json',
        os.homedir() + '/.jiralead/config.json',
    ]))
        .map(function (pathName) { return path.normalize(pathName); });
    var existingFile = tryFiles.find(function (path) { return fs.existsSync(path); });
    if (existingFile) {
        return require(process.cwd() + '/config.json');
    }
    else {
        console.error("Couldn't find any of the following files:\n" + tryFiles.join("\n") + "\n\nCopy " + path.normalize(__dirname + '/../config.json.example') + " and progress from there");
        process.exit(1);
    }
})();
var lowercaseStatuses = config.statuses
    .map(function (status) { return status.toLowerCase(); });
var statuses = lowercaseStatuses
    .map(function (status) { return status.replace('*', ''); });
var finalStatuses = lowercaseStatuses
    .filter(function (status) { return status.indexOf('*') >= 0; })
    .map(function (status) { return status.replace('*', ''); });
if (finalStatuses.length === 0) {
    var finalStatusGuess = statuses[statuses.length - 1];
    console.log("No status marked as final in the config.json. Guessing '" + finalStatusGuess + "' as the final status");
    console.log('Mark the statuses that close a ticket with a "*" before the status name in your config.json');
    console.log();
    finalStatuses.push(finalStatusGuess);
}
var argv = yargs.argv;
var keys = (argv.query ? [] : argv._);
var query = (argv.query ? argv.query : null);
var file = (argv.file ? argv.file : null);
function prettyPrintTimes(values, statuses) {
    return statuses
        .map(function (s) { return s.toLowerCase(); })
        .map(function (s) { return values[s] || 0; })
        .join(',');
}
function prettyPrintDate(date) {
    return date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
}
function getTicketTimeStrings(keys) {
    return __awaiter(this, void 0, void 0, function () {
        var heading, timePromises, timeResults, lines;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    heading = ["Key,Created,Finished," + config.statuses.map(function (s) { return s.replace('*', ''); }).join(',')];
                    timePromises = keys.map(function (key) { return lib_1.timesInStatusesForTicket(key, config.jira, finalStatuses); });
                    return [4 /*yield*/, Promise.all(timePromises)];
                case 1:
                    timeResults = _a.sent();
                    lines = timeResults.map(function (times) { return times.key
                        + ',' + prettyPrintDate(times.created)
                        + ',' + ((times.finished) ? prettyPrintDate(times.finished) : '')
                        + ',' + prettyPrintTimes(times.times, config.statuses); });
                    return [2 /*return*/, heading.concat(lines)];
            }
        });
    });
}
(function () { return __awaiter(_this, void 0, void 0, function () {
    var strings;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!query) return [3 /*break*/, 2];
                return [4 /*yield*/, lib_1.getKeysInJQL(query, config.jira)];
            case 1:
                keys = _a.sent();
                _a.label = 2;
            case 2:
                if (!(keys.length > 0)) return [3 /*break*/, 4];
                return [4 /*yield*/, getTicketTimeStrings(keys)];
            case 3:
                strings = _a.sent();
                if (!file) {
                    strings.forEach(function (line) { console.log(line); });
                }
                else {
                    console.log("Writing to " + file);
                    fs.writeFileSync(file, strings.join("\n"), { encoding: 'utf-8' });
                    console.log("Success!");
                }
                return [3 /*break*/, 5];
            case 4:
                console.log('run [--file=FILE_NAME] [--query=JQL | KEY1 [KEY2 [...]]]');
                console.log();
                console.log('Example: run --file=out.csv --query="project in (br,pay) and type in (bug,task,story) and status = done"');
                console.log('Example: run --file=out.csv br-1 pay-1');
                console.log('Example: run pay-4000');
                process.exit(1);
                _a.label = 5;
            case 5: return [2 /*return*/];
        }
    });
}); })();
