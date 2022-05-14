import * as fs from "fs";
import * as path from "path";

const root = "../src/resources/facebook-azraftaohid/messages/";
const nameSelf = "Azraf Taohid";

export async function countMessages(...persons: string[][]): Promise<BulkCountResult> {
    const aggregateCount = blankCountResult();
    const result: BulkCountResult = { aggregated: aggregateCount, list: [] };

    for (const aliases of persons) {
        try {
            const count = await countAllMessagesOf(...aliases);
            aggregateResult(result.aggregated, count);
            result.list.push({ aliases, count });
        } catch (error) {
            console.log(`Error counting [name: ${aliases[0]}; reason: ${error}]`);
        }
    }

    return result;
}

async function countAllMessagesOf(...names: string[]) {
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

export interface CountResult {
    sentCount: number,
    receivedCount: number,
    wordSentCount: number,
    wordReceivedCount: number,
    startMs: number,
    endMs: number,
}

export interface BulkCountResult {
    aggregated: CountResult,
    list: {
        aliases: string[],
        count: CountResult,
    }[]
}