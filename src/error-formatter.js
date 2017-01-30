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
 * Format an Operation block or a Blame message block.
 *
 * @param  {Object} block
 * @return {string}
 */
function formatOperationOrBlame(block) {

    let lines = [
        chalk.cyan(block.path + ':' + block.line),
        chalk.yellow(block.context)
    ];

    const indent = ' '.repeat(block.start - 1);
    const type   = block.descr;

    if (block.endline === block.line) {
        // Single line of source code
        const marker = '^'.repeat((block.end - block.start) + 1);
        lines.push(indent + chalk.magenta(marker + ' ' + type));
    } else {
        // Multiple lines of source code
        lines.push(indent + chalk.magenta('^ ' + type));
    }

    return indentAndJoinLines(lines);

}

/**
 * Format a Comment message block.
 *
 * @param  {Object} block
 * @return {string}
 */
function formatComment(block) {

    const lines = [
        chalk.red(block.descr)
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

    let formattedLines = [];

    if (err.operation) {
        formattedLines.push(formatOperationOrBlame(err.operation));
    }

    formattedLines = formattedLines.concat(
        err.message.map(function (msg) {
            switch (msg.type) {
                case 'Blame':
                    return formatOperationOrBlame(msg);
                case 'Comment':
                    return formatComment(msg);
                default:
                    throw new Error('Unrecognised error message: ' + msg);
            }
        })
    );

    return formattedLines.join('\n\n');

}

module.exports = formatFlowErrorObject;
