'use strict';

const chalk = require('chalk');


/**
 * Indent the specified lines, and then join them.
 *
 * @param  {Array<string>} lines
 * @return {string}
 */
function indentAndJoinLines(lines) {

    return lines.map(line => ' '.repeat(8) + line).join('\n');

}

/**
 * Format a Blame message object.
 *
 * @param  {Object} msg
 * @return {string}
 */
function formatBlameMessage(msg) {

    let lines = [
        chalk.cyan(msg.path + ':' + msg.line),
        chalk.yellow(msg.context)
    ];

    const indent = ' '.repeat(msg.start - 1);
    const type   = msg.descr;

    if (msg.endline === msg.line) {
        // Single line of source code
        const marker = '^'.repeat((msg.end - msg.start) + 1);
        lines.push(indent + chalk.magenta(marker + ' ' + type));
    } else {
        // Multiple lines of source code
        lines.push(indent + chalk.magenta('^ ' + type));
    }

    return indentAndJoinLines(lines);

}

/**
 * Format a Comment message object.
 *
 * @param  {Object} msg
 * @return {string}
 */
function formatCommentMessage(msg) {

    const lines = [
        chalk.red(msg.descr)
    ];

    return indentAndJoinLines(lines);

}

/**
 * Format a Flow error object.
 *
 * @param  {Object} err
 * @return {string}
 */
function formatFlowErrorObject(err) {

    const formattedLines = err.message.map(function (msg) {
        switch (msg.type) {
            case 'Blame':
                return formatBlameMessage(msg);
            case 'Comment':
                return formatCommentMessage(msg);
            default:
                throw new Error('Unrecognised error message: ' + msg);
        }
    });

    return formattedLines.join('\n\n');

}

module.exports = formatFlowErrorObject;
