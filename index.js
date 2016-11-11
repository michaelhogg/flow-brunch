'use strict';

const chalk        = require('chalk');
const childProcess = require('child_process');
const flow         = require('flow-bin');


/**
 * Format a Blame message object.
 *
 * @param  {Object} msg
 * @return {Array<string>}
 */
function formatBlameMessage(msg) {

    let lines = [
        chalk.cyan(msg.path + ':' + msg.line),
        chalk.yellow(msg.context)
    ];

    const indent = ' '.repeat(msg.start - 1);
    const type   = '<' + msg.descr + '>';

    if (msg.endline === msg.line) {
        // Single line of source code
        const marker = '^'.repeat((msg.end - msg.start) + 1);
        lines.push(indent + chalk.red(marker + ' ' + type));
    } else {
        // Multiple lines of source code
        lines.push(indent + chalk.red('^ ' + type));
    }

    return lines;

}

/**
 * Format a Comment message object.
 *
 * @param  {Object} msg
 * @return {Array<string>}
 */
function formatCommentMessage(msg) {

    const lines = [
        chalk.red(msg.descr)
    ];

    return lines;

}

/**
 * Format a Flow error object.
 *
 * @param  {Object} err
 * @return {string}
 */
function formatFlowErrorObject(err) {

    const formattedLines = err.message.map(function (msg) {
        let lines = [];
        switch (msg.type) {
            case 'Blame':
                lines = formatBlameMessage(msg);
                break;
            case 'Comment':
                lines = formatCommentMessage(msg);
                break;
            default:
                throw new Error('Unrecognised error message: ' + msg);
        }
        return lines.map(line => '    ' + line).join('\n');
    });

    return formattedLines.join('\n\n');

}

/**
 * Format errors reported by Flow.
 *
 * @param  {string} lintPath   - Path of the source file being linted
 * @param  {string} flowStdout - STDOUT from Flow
 * @return {string}
 */
function formatErrors(lintPath, flowStdout) {

    let formattedErrors = [];

    JSON.parse(flowStdout).errors.forEach(function (error) {
        const pathMatch = error.message.some(function (msg) {
            return (msg.type === 'Blame' && lintPath === msg.path);
        });
        if (pathMatch) {
            formattedErrors.push(formatFlowErrorObject(error));
        }
    });

    return formattedErrors.join('\n\n' + '-'.repeat(20) + '\n\n');

}

/**
 * @see brunch.io/docs/plugins#boilerplate-plugin
 * @see github.com/flowtype/flow-bin#api
 */
class FlowLinter {

    constructor(brunchConfig) {
        const cfg = (brunchConfig && brunchConfig.plugins && brunchConfig.plugins.flowtype) || {};
        this.warnOnly = (typeof cfg.warnOnly === 'boolean') ? cfg.warnOnly : false;
        try {
            // Start Flow server (if not already started).
            childProcess.execFileSync(flow, ['status'], { stdio: [
                'ignore',  // stdin  -- Attach to /dev/null
                'ignore',  // stdout -- Attach to /dev/null
                'inherit'  // stderr -- Attach to process.stderr so Flow server startup messages are displayed to user
            ]});
        } catch (e) {
            // Probably a linting error, just ignore it for now.
            // @todo Handle this error properly.
        }
    }

    lint(data, path) {
        const context = this;
        return new Promise(function (resolve, reject) {
            childProcess.execFile(flow, ['status', '--json', '--strip-root'], function (err, stdout, stderr) {
                let formattedErrors = formatErrors(path, stdout);
                if (formattedErrors === '') {
                    resolve();
                } else {
                    formattedErrors = 'Flow reported:\n' + formattedErrors;
                    if (context.warnOnly) {
                        formattedErrors = 'warn: ' + formattedErrors;
                    }
                    reject(formattedErrors);
                }
            });
        });
    }

}

FlowLinter.prototype.brunchPlugin = true;
FlowLinter.prototype.type         = 'javascript';
FlowLinter.prototype.pattern      = /\.jsx?$/;

module.exports = FlowLinter;
