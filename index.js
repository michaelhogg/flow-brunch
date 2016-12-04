'use strict';

// Node.js
const childProcess = require('child_process');

// NPM
const flow = require('flow-bin');

// Flow linting methods
const methodCheckContents = require('./src/methods/check-contents.js');
const methodStatus        = require('./src/methods/status.js');


/**
 * Get the specified Flow linting method.
 *
 * @param  {string} methodName
 * @return {Function}
 */
function getLintingMethod(methodName) {

    switch (methodName) {
        case 'check-contents':
            return methodCheckContents;
        case 'status':
            return methodStatus;
        default:
            throw new Error('Invalid Flow linting method: ' + methodName);
    }

}

/**
 * @see brunch.io/docs/plugins#boilerplate-plugin
 * @see github.com/flowtype/flow-bin#api
 */
class FlowLinter {

    constructor(brunchConfig) {

        const cfg = (brunchConfig && brunchConfig.plugins && brunchConfig.plugins.flowtype) || {};

        this.lintingMethod  = (typeof cfg.method   === 'string' ) ? getLintingMethod(cfg.method) : methodStatus;
        this.warnOnly       = (typeof cfg.warnOnly === 'boolean') ? cfg.warnOnly : false;
        this.lintingOptions = {
            statusDelay: (typeof cfg.statusDelay === 'number') ? cfg.statusDelay : 250
        };

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

        const flowlinter = this;

        return new Promise(function (resolve, reject) {
            flowlinter.lintingMethod(data, path, flowlinter.lintingOptions, function (formattedErrors) {
                if (formattedErrors.length === 0) {
                    resolve();
                } else {
                    const errorSeparator = '\n\n' + ' '.repeat(4) + '-'.repeat(20) + '\n\n';
                    let output = 'Flow reported:\n\n' + formattedErrors.join(errorSeparator) + '\n';
                    if (flowlinter.warnOnly) {
                        output = 'warn: ' + output;  // github.com/brunch/brunch/blob/2.9.1/lib/fs_utils/pipeline.js#L21
                    }
                    reject(output);
                }
            });
        });

    }

}

FlowLinter.prototype.brunchPlugin = true;
FlowLinter.prototype.type         = 'javascript';
FlowLinter.prototype.pattern      = /\.jsx?$/;

module.exports = FlowLinter;
