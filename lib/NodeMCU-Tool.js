var _fs = require('fs');
var _nodeMcuConnector = require('./NodeMcuConnector');
var _serialTerminal = require('./SerialTerminal');

// global default error handler
var errorHandler = function(source, error){
    console.error('[' + source + '] ' + error);
};

// status messages
var statusHandler = function(source, message){
    console.log('[' + source + '] ' + message);
};

// print
var logStatus = function(source, message){
    if (statusHandler){
        statusHandler(source, message);
    }
};
var logError = function(source, error){
    if (errorHandler){
        errorHandler(source, error);
    }
};

// Programmatic Access to the core functions
var Tool = {

    // access the connector directly
    Connector: _nodeMcuConnector,

    // set the error handler
    onError: function(handler){
        errorHandler = handler;
    },

    // set status handler
    onStatus: function(handler){
        statusHandler = handler;
    },

    // show file-system info
    fsinfo: function(port, baud){
        // create new connector
        var connector = new _nodeMcuConnector(port, baud);

        // handle connection errors
        connector.onError(errorHandler);

        connector.connect(function(){
            connector.fsinfo(function(meta, files){

                logStatus('NodeMCU', 'Free Disk Space: ' + meta.remaining + ' KB | Total: ' + meta.total + ' KB');
                logStatus('NodeMCU', 'Files stored into Flash (SPIFFS)');

                // print fileinfo
                files.forEach(function(file){
                    logStatus('', ' |- ' + file.name + ' (' + file.size + ' Bytes)');
                });
                logStatus('', '');

                // finished!
                connector.disconnect();
            });
        });
    },

    // upload a local file to nodemcu
    upload: function(port, baud, localFile, options, onProgess){
        // local file available ?
        if (!_fs.existsSync(localFile)){
            errorHandler('NodeMCU-Tool', 'Local file not found "' + localFile + '"');
            return;
        }

        // create new connector
        var connector = new _nodeMcuConnector(port, baud);

        // handle connection errors
        connector.onError(errorHandler);

        connector.connect(function(){
            connector.upload(localFile, options.optimize,
                // onComplete
                function(){
                    logStatus('NodeMCU-Tool', 'Data Transfer complete!');

                    // compile flag set ?
                    if (options.compile){
                        logStatus('NodeMCU', 'compiling lua file..');

                        connector.compile(localFile, function(error){
                            // success ? empty line will return (null)
                            if (error){
                                connector.disconnect();
                                logError('NodeMCU', 'Error: ' + error);
                            }else{
                                logStatus('NodeMCU', 'Success');

                                // drop oiginal lua file
                                connector.removeFile(localFile, function(){
                                    connector.disconnect();
                                    logStatus('NodeMCU', 'Original LUA file removed');
                                });
                            }
                        });

                    }else{
                        // finished!
                        connector.disconnect();
                    }
                },

                // on progress handler
                onProgess || function(){}
            );
        });
    },

    // run a file on NodeMCU (.lc or .lua)
    run: function(port, baud, filename){
        // create new connector
        var connector = new _nodeMcuConnector(port, baud);

        // handle connection errors
        connector.onError(errorHandler);

        connector.connect(function(){
            connector.run(filename, function(output){
                // just show complete message (no feedback from nodemcu)
                logStatus('NodeMCU', 'Running "' + filename + '"');
                logStatus('', output);

                // finished!
                connector.disconnect();
            });
        });
    },

    // removes a file o nodemcu
    remove: function(port, baud, filename, cb){
        // create new connector
        var connector = new _nodeMcuConnector(port, baud);

        // handle connection errors
        connector.onError(errorHandler);

        connector.connect(function(){
            connector.removeFile(filename, function(){
                // just show complete message (no feedback from nodemcu)
                logStatus('NodeMCU', 'File "' + filename + '" removed!');

                // finished!
                connector.disconnect();
            });
        });
    },

    // format the file system
    mkfs: function(port, baud){
        // create new connector
        var connector = new _nodeMcuConnector(port, baud);

        // handle connection errors
        connector.onError(errorHandler);

        connector.connect(function(){
            logStatus('NodeMCU', 'Formatting the file system...this will take around ~30s');

            connector.format(function(response){
                // just show complete message
                logStatus('NodeMCU', 'File System created | ' + response);

                // finished!
                connector.disconnect();
            });
        });

    },

    // serial terminal <> console session
    terminal: function(port, baud){
        // create new connector
        var terminal = new _serialTerminal();

        // handle connection errors
        terminal.onError(errorHandler);

        // start
        terminal.passthrough(port, baud);
    }
};

module.exports = Tool;
