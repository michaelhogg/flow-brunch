'use strict';

const childProcess = require('child_process');
const flow         = require('flow-bin');


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
