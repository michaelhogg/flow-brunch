'use strict';

// Node.js
const childProcess = require('child_process');
const stream       = require('stream');

// NPM
const flow = require('flow-bin');

// Library
const errorFormatter = require('../error-formatter.js');


/**
 * Take a string and create a Readable Stream.
 *
 * @param  {string} input
 * @return {stream.Readable}
 * @see    nodejs.org/api/stream.html#stream_implementing_a_readable_stream
 */
function createReadableStreamFromString(input) {

    const readableStream = new stream.Readable();

    readableStream.push(input);  // Add data to the internal queue for users of the stream to consume
    readableStream.push(null);   // Signals the end of the stream (EOF)

    return readableStream;

}

/**
 * Format errors reported by Flow.
 *
 * @param  {string} flowStdout
 * @return {Array<string>}
 */
function formatErrors(flowStdout) {

    const formattedErrors = JSON.parse(flowStdout).errors.map(error => errorFormatter(error));

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

    const args = ['check-contents', '--json', '--respect-pragma', '--strip-root', path];

    const child = childProcess.execFile(flow, args, function (err, stdout, stderr) {
        const formattedErrors = formatErrors(stdout);
        callback(formattedErrors);
    });

    const fileStream = createReadableStreamFromString(data);

    fileStream.pipe(child.stdin);

};
