'use strict';

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
