import { formatDate } from "@thegoodcompany/common-utils-js";
import { countMessages, CountResult } from "./counter";

const aliasOmi = "\u00e0\u00a6\u00b8\u00e0\u00a6\u00be\u00e0\u00a6\u00a6\u00e0\u00a6\u00bf\u00e0\u00a6\u00af\u00e0\u00a6\u00bc\u00e0\u00a6\u00be \u00e0\u00a6\u0085\u00e0\u00a6\u00ae\u00e0\u00a6\u00bf";

function presentResult(subject: string, count: CountResult) {
    const strStart = formatDate(new Date(count.startMs), "short", "year", "month", "day");
    const strEnd = formatDate(new Date(count.endMs), "short", "year", "month", "day");
    const strSent = `${count.sentCount}`;
    const strReceived = `${count.receivedCount}`;
    const strTotal = `${count.sentCount + count.receivedCount}`;

    return `\n| ${subject.padEnd(15, " ")} | ${strStart.padEnd(14, " ")} | ${strEnd.padEnd(14, " ")} ` 
        + `| ${strSent.padEnd(14, " ")} | ${strReceived.padEnd(14, " ")} | ${strTotal.padEnd(14, " ")} |`;
}

console.debug = () => { /* no-op */ };
countMessages(["Maria Afrin"], ["Durjoy Saha"], ["Sadia Omi", aliasOmi], ["Hasan Woaliu", "Woa Liu"], ["Rafi", "Md Asiful Hasan Rafi"], ["Tasnim Jahan"]).then(({ list, aggregated }) => {
    let strTable = `\n| Name            | Start          | End            | Sent           | Received       | Total          |\n`
        +            `| ............... | .............. | .............. | .............. | .............. | .............. |`;

    list.sort((a, b) => (b.count.sentCount + b.count.receivedCount) - (a.count.sentCount + a.count.receivedCount));
    list.forEach(value => strTable += presentResult(value.aliases[0], value.count))

    strTable += `\n| .................................................................................................... |`;
    strTable += presentResult("Total", aggregated);
    
    console.log(strTable);
})