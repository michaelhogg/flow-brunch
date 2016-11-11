'use strict';

// Node.js
const childProcess = require('child_process');

// NPM
const flow = require('flow-bin');

// Library
const errorFormatter = require('../error-formatter.js');


/**
 * Format errors reported by Flow.
 *
 * @param  {string} lintPath   - Path of the source file being linted
 * @param  {string} flowStdout - STDOUT from Flow
 * @return {Array<string>}
 */
function formatErrors(lintPath, flowStdout) {

    let formattedErrors = [];

    JSON.parse(flowStdout).errors.forEach(function (error) {
        const pathMatch = error.message.some(function (msg) {
            return (msg.type === 'Blame' && lintPath === msg.path);
        });
        if (pathMatch) {
            formattedErrors.push(errorFormatter(error));
        }
    });

    return formattedErrors;

}

/**
 * Main linting function.
 *
 * @param {string}   data
 * @param {string}   path
 * @param {Object}   lintingOptions
 * @param {Function} callback
 */
module.exports = function (data, path, lintingOptions, callback) {

    setTimeout(
        function () {

            const args = ['status', '--json', '--strip-root'];

            childProcess.execFile(flow, args, function (err, stdout, stderr) {
                const formattedErrors = formatErrors(path, stdout);
                callback(formattedErrors);
            });

        },
        lintingOptions.statusDelay
    );

};
