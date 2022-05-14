import { formatDate } from "@thegoodcompany/common-utils-js";
import * as fs from "fs";
import * as path from "path";

const root = "../src/resources/facebook-azraftaohid/messages/";
const nameSelf = "Azraf Taohid";

const omi = "\u00e0\u00a6\u00b8\u00e0\u00a6\u00be\u00e0\u00a6\u00a6\u00e0\u00a6\u00bf\u00e0\u00a6\u00af\u00e0\u00a6\u00bc\u00e0\u00a6\u00be \u00e0\u00a6\u0085\u00e0\u00a6\u00ae\u00e0\u00a6\u00bf";

async function start() {
    const aggregateCount = blankCountResult();

    let result = `\n| Name            | Start          | End            | Sent/words     | Received/words | Total          |\n`
        +          `| ............... | .............. | .............. | .............. | .............. | .............. |`;
    
    for (const aliases of [["Maria Afrin"], ["Durjoy Saha"], ["Sadia Omi", omi], ["Hasan Woaliu"], ["Rafi", "Md Asiful Hasan Rafi"], ["Tasnim Jahan"]]) {
        try {
            const count = await countMessages(...aliases);
            aggregateResult(aggregateCount, count);

            result += presentResult(aliases[0], count);
        } catch (error) {
            console.log(`Error counting [name: ${aliases[0]}; reason: ${error}]`);
        }
    }

    result += `\n| .....................................................................................................|`;
    result += presentResult("Total", aggregateCount);
    console.log(result);
}

async function countMessages(...names: string[]) {
    let res: CountResult = blankCountResult();
    try {
        aggregateResult(res, await countMessagesIn("inbox", ...names));
        aggregateResult(res, await countMessagesIn("archived_threads", ...names));
        aggregateResult(res, await countMessagesIn("filtered_threads", ...names));
        aggregateResult(res, await countMessagesIn("message_requests", ...names));
    } catch (error) {
        return Promise.reject(error);
    }
    
    return res;
}

async function countMessagesIn(box: string, ...names: string[]): Promise<CountResult> {
    let sentCount = 0;
    let receivedCount = 0;
    let wordSentCount = 0;
    let wordReceivedCount = 0;
    let startMs = 0;
    let endMs = 0;

    const boxPath = root + box + "/";
    const inboxes: string[] = fs.readdirSync(path.resolve(__dirname, boxPath));

    inboxes.forEach((inboxName) => {
        const inboxPath = boxPath + inboxName + "/";
        const propertiesName = fs.readdirSync(path.resolve(__dirname, inboxPath));

        propertiesName.every((propertyName) => {
            const matches = propertyName.match(`message_[0-9].json`);

            if (!matches || matches.length == 0) {
                console.debug(`skipping property [box: ${box}; name: ${propertyName}]`);
                return true;
            }

            const chat: Chat = require(inboxPath + propertyName);
            const participants: Participant[] = chat.participants;

            if (participants.some((participant) => names.includes(participant.name))) {
                if (participants.length == 2) {
                    chat.messages.forEach(mssg => {
                        const wordCount = mssg.content?.split(" ").length || 0;

                        if (mssg.sender_name === nameSelf) {
                            if (mssg.content) wordSentCount += wordCount;
                            sentCount++;
                        } else {
                            if (mssg.content) wordReceivedCount += wordCount;
                            receivedCount++;
                        }

                        if (mssg.timestamp_ms) {
                            startMs = Math.min(startMs ? startMs : mssg.timestamp_ms, mssg.timestamp_ms);
                            endMs = Math.max(endMs, mssg.timestamp_ms);
                        }
                    })
                } else {
                    return false; // maybe a group with more poeple
                }
            } else {
                // someone else's conversation
                return false;
            }
            
            return true; // check more
        })
    });

    return { sentCount, receivedCount, wordSentCount, wordReceivedCount, startMs, endMs };
}

function aggregateResult(r1: CountResult, r2: CountResult): void {
    if (r2.startMs) r1.startMs = Math.min(r1.startMs ? r1.startMs : r2.startMs, r2.startMs);
    
    r1.endMs = Math.max(r1.endMs, r2.endMs);
    r1.wordSentCount += r2.wordSentCount;
    r1.wordReceivedCount += r2.wordReceivedCount;
    r1.receivedCount += r2.receivedCount;
    r1.sentCount += r2.sentCount;
}

function blankCountResult() {
    return {
        startMs: 0,
        endMs: 0,
        wordSentCount: 0,
        wordReceivedCount: 0,
        receivedCount: 0,
        sentCount: 0
    };
}

function presentResult(subject: string, count: CountResult) {
    const strStart = formatDate(new Date(count.startMs), "short", "year", "month", "day");
    const strEnd = formatDate(new Date(count.endMs), "short", "year", "month", "day");
    const strSent = `${count.sentCount}/${count.wordSentCount}`;
    const strReceived = `${count.receivedCount}/${count.wordReceivedCount}`;
    const strTotal = `${count.sentCount + count.receivedCount}/${count.wordSentCount + count.wordReceivedCount}`;

    return `\n| ${subject.padEnd(15, " ")} | ${strStart.padEnd(14, " ")} | ${strEnd.padEnd(14, " ")} ` 
        + `| ${strSent.padEnd(14, " ")} | ${strReceived.padEnd(14, " ")} | ${strTotal.padEnd(14, " ")} |`;
}

console.debug = () => { /* no-op */ };
start();


interface Participant {
    name: string
}

interface Message {
    sender_name: string,
    timestamp_ms: number,
    content?: string,
    is_unsent: boolean,
}

interface Chat {
    participants: Participant[],
    messages: Message[]
}

interface CountResult {
    sentCount: number,
    receivedCount: number,
    wordSentCount: number,
    wordReceivedCount: number,
    startMs: number,
    endMs: number,
}