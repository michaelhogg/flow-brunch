'use strict';

/**
 * Is the current Node.js process the Brunch master process?
 * If not, then the process is a multi-CPU-core Brunch child worker.
 *
 * @see nodejs.org/dist/latest-v7.x/docs/api/process.html#process_process_argv
 * @see brunch.io/docs/commands#-brunch-build-brunch-b-
 * @see github.com/brunch/brunch/blob/2.9.1/lib/workers
 */
function isProcessBrunchMaster() {

    // This is likely to be one of:
    //     Master:  "node_modules/.bin/brunch"
    //     Child:   "node_modules/brunch/lib/workers/job-processor.js"
    const scriptFilePath = process.argv[1];

    return (scriptFilePath.indexOf('lib/workers/job-processor.js') === -1);

}

module.exports = {
    isProcessBrunchMaster: isProcessBrunchMaster
};
