import * as fs from "fs";
import * as path from "path";

const root = "../src/resources/facebook-azraftaohid/messages/";

async function start() {
    let count = 0;

    try {
        count += await countMessages("Maria Afrin");
        count += await countMessages("Durjoy Saha");
    } catch (error) {
        console.log(`Error counting [reason: ${error}]`);
    }

    console.log(`Total count: ${count}`);
}

async function countMessages(...names: string[]) {
    let count = 0;

    try {
        count += await countMessagesIn("inbox", ...names);
        count += await countMessagesIn("archived_threads", ...names);
        count += await countMessagesIn("filtered_threads", ...names);
        count += await countMessagesIn("message_requests", ...names);
    } catch (error) {
        return Promise.reject(error);
    }

    console.log(`\n...........................................................................\n`);
    console.log(`Message counted [participant: ${names[0]}; total count: ${count}]`);
    console.log(`\n...........................................................................\n`);
    
    return count;
}

async function countMessagesIn(box:string, ...names: string[]) {
    let overallCount = 0;
    const boxPath = root + box + "/";
    const inboxes: string[] = fs.readdirSync(path.resolve(__dirname, boxPath));

    inboxes.forEach((inboxName) => {
        const inboxPath = boxPath + inboxName + "/";
        const propertiesName = fs.readdirSync(path.resolve(__dirname, inboxPath));

        propertiesName.every((propertyName) => {
            let messageCount = 0;
            const matches = propertyName.match(`message_[0-9].json`);

            if (!matches || matches.length == 0) {
                return true;
            }

            const chat: Chat = require(inboxPath + propertyName);
            const participants: Participant[] = chat.participants;

            if (participants.some((participant) => names.includes(participant.name))) {
                if (participants.length == 2) {
                    messageCount += chat.messages.length;
                } else {
                    console.log(`Inbox ignored [inbox: ${trimInboxName(inboxName)}; reason: may be a group]`);
                    return false;
                }
            } else {
                // someone else's conversation
                return false;
            }

            console.log(`Message counted [inbox: ${trimInboxName(inboxName)}; count: ${messageCount}]`);
            overallCount += messageCount;

            return true;
        })
    });

    console.log(`Message counted [participant: ${names[0]}; message box: ${box.replace(/_/g, " ")}; count: ${overallCount}]`);
    return overallCount;
}

function trimInboxName(inbox: string): string {
    const end = inbox.lastIndexOf("_");
    return inbox.substring(0, end);
}

start();


interface Participant {
    name: string
}

interface Message {
    sender_name: number,
    timestamp: number,
    is_unsent: boolean,
}

interface Chat {
    participants: Participant[],
    messages: Message[]
}