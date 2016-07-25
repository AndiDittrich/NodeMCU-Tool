var _fs = require('fs');
var _nodeMcuConnector = require('./NodeMcuConnector');
var _serialTerminal = require('./SerialTerminal');
var _path = require('path');
var _loggingFacility = require('logging-facility');

// NodeMCU-Tool Context Logger
var _logger = _loggingFacility.getLogger('NodeMCU-Tool');

// NodeMCU Context Logger
var _mculogger = _loggingFacility.getLogger('NodeMCU');

// Serial Terminal Context Logger
var _terminallogger = _loggingFacility.getLogger('SerialTerminal');

// output
var outputHandler = function(message){
    console.log(message);
};

var writeOutput = function(message){
    if (outputHandler){
        outputHandler(message);
    }
};

// Programmatic Access to the core functions
var Tool = {

    // access the connector directly
    Connector: _nodeMcuConnector,

    // set output handler
    onOutput: function (handler) {
        outputHandler = handler;
    }
};

// helper function to create a NodeMCU Tool Connection
var getConnection = function(port, baud, cb){

    // create new connector
    var connector = new _nodeMcuConnector(port, baud);

    // open connection
    connector.connect(function(error, response){
        if (error) {
            _logger.error('Unable to establish connection - ' + error);
        }else{
            // status message
            _logger.log('Connected');
            _mculogger.log(response);

            cb(connector);
        }
    });
};

// show file-system info
Tool.fsinfo = function(port, baud, format){

    // try to establish a connection to the module
    getConnection(port, baud, function(connector){

        connector.fsinfo(function(err, meta, files){

            // finished!
            connector.disconnect();

            if (err){
                _logger.error(err);
            }else{

                // json output - third party applications
                if (format == 'json') {
                    writeOutput(JSON.stringify({
                        files: files,
                        meta: meta
                    }));

                // raw format - suitable for use in bash scripts
                }else if (format == 'raw'){
                    // print fileinfo
                    files.forEach(function(file){
                        writeOutput(file.name + '\t' + file.size);
                    });

                }else{
                    _mculogger.log('Free Disk Space: ' + meta.remaining + ' KB | Total: ' + meta.total + ' KB | ' + files.length + ' Files');

                    // files found ?
                    if (files.length==0){
                        _mculogger.log('No Files found - have you created the file-system?');
                    }else{
                        _mculogger.log('Files stored into Flash (SPIFFS)');

                        // print fileinfo
                        files.forEach(function(file){
                            writeOutput('\t  |- ' + file.name + ' (' + file.size + ' Bytes)');
                        });
                    }
                }
            }
        });
    });
};

// upload a local file to nodemcu
Tool.upload = function(port, baud, localFiles, options, onProgess){

    // the index of the current uploaded file
    var fileUploadIndex = 0;

    var uploadFile = function(connector, localFile, remoteFilename, onComplete){

        // increment upload index
        fileUploadIndex++;

        // get file stats
        try{
            var fileInfo = _fs.statSync(localFile);

        // local file available
        }catch (err){
            _logger.error('Local file not found "' + localFile + '" skipping...');
            onComplete();
            return;
        }

        // display filename
        _logger.log('Uploading "' + localFile + '" >> "' + remoteFilename + '"...');
        
        // trigger a progress update
        onProgess(0, fileInfo.size, fileUploadIndex);

        // normalize the remote filename (strip relative parts)
        remoteFilename = remoteFilename.replace(/\.\.\//g, '').replace(/\.\./g, '').replace(/^\.\//, '');

        // delete old file (may existent)
        connector.removeFile(remoteFilename, function(err){

            // handle error
            if (err){
                connector.disconnect();
                _logger.error(err);
                return;
            }

            // start the file transfer
            connector.upload(localFile, remoteFilename, options,

                // onComplete
                function(err){

                    // handle error
                    if (err){
                        connector.disconnect();
                        _logger.error(err);
                        return;
                    }

                    // compile flag set ? and is a lua file ?
                    if (options.compile && _path.extname(localFile).toLowerCase() == '.lua'){
                        _mculogger.log(' |- compiling lua file..');

                        connector.compile(remoteFilename, function(error){
                            // success ? empty line will return (null)
                            if (error){
                                connector.disconnect();
                                _mculogger.error('Error: ' + error);
                            }else{
                                _mculogger.log(' |- success');

                                // drop original lua file
                                connector.removeFile(remoteFilename, function(error){

                                    if (error){
                                        connector.disconnect();
                                        _mculogger.error('Error: ' + error);
                                        return;
                                    }

                                    _mculogger.log(' |- original LUA file removed');
                                    onComplete();
                                });
                            }
                        });
                    }else{
                        // directly call complete handler
                        onComplete();
                    }
                },

                // on progress handler
                function(current, total){
                    // proxy and append file-number
                    onProgess(current, total, fileUploadIndex);
                }
            );
        });
    };

    // try to establish a connection to the module
    getConnection(port, baud, function(connector){

        // single file upload ?
        if (localFiles.length == 1){
            // extract first element
            var localFile = localFiles[0];

            // filename defaults to original filename minus path.
            // this behaviour can be overridden by --keeppath and --remotename options
            var remoteFile = options.remotename ? options.remotename : (options.keeppath ? localFile : _path.basename(localFile));

            // start single file upload
            uploadFile(connector, localFile, remoteFile, function(){
                // close connection
                connector.disconnect();

                // log message
                _logger.log('File Transfer complete!');
            });

        // bulk upload ?
        }else{

            var uploadNext = function(){

                // file available ?
                if (localFiles.length > 0){

                    // extract file
                    var localFile = localFiles.shift();

                    // keep-path option set ?
                    var remoteFile = (options.keeppath ? localFile : _path.basename(localFile));

                    // trigger upload
                    uploadFile(connector, localFile, remoteFile, uploadNext);

                // no more file available
                }else{
                    // close connection
                    connector.disconnect();

                    // log message
                    _logger.log('Bulk File Transfer complete!');
                }
            };

            // trigger initial upload
            uploadNext();
        }
    });
};

// download a remote file from nodemcu
Tool.download = function(port, baud, remoteFile){
    // strip path
    var localFilename = _path.basename(remoteFile);

    // local file with same name already available ?
    if (_fs.existsSync(remoteFile)){
        // change filename
        localFilename += '.' + (new Date().getTime());

        _logger.log('Local file "' + remoteFile + '" already exist - new file renamed to "' + localFilename + '"');
    }

    // try to establish a connection to the module
    getConnection(port, baud, function(connector){
        _logger.log('Downloading "' + remoteFile + '" ...');

        connector.download(remoteFile,
            // onComplete
            function(err, filedata){
                // finished!
                connector.disconnect();

                if (err){
                    _logger.error('Data Transfer FAILED!');
                }else{
                    _logger.log('Data Transfer complete!');

                    // store local file
                    _fs.writeFileSync(localFilename, filedata);

                    _logger.log('File "' + localFilename + '" created');
                }
            }
        );
    });
};

// run a file on NodeMCU (.lc or .lua)
Tool.run = function(port, baud, filename){

    // try to establish a connection to the module
    getConnection(port, baud, function(connector){
        connector.run(filename, function(err, output){
            // finished!
            connector.disconnect();

            if (err){
                _mculogger.error(err);
            }else{
                // show command response
                _mculogger.log('Running "' + filename + '"');
                _mculogger.log('>----------------------------->');
                writeOutput(output);
                _mculogger.log('>----------------------------->');
            }
        });
    });
};

// removes a file from NodeMCU
Tool.remove = function(port, baud, filename){

    // try to establish a connection to the module
    getConnection(port, baud, function(connector){
        connector.removeFile(filename, function(err){
            // finished!
            connector.disconnect();

            if (err){
                _mculogger.error(err);
            }else{
                // just show complete message (no feedback from nodemcu)
                _mculogger.log('File "' + filename + '" removed!');
            }
        });
    });
};

// format the file system
Tool.mkfs = function(port, baud){

    // try to establish a connection to the module
    getConnection(port, baud, function(connector){

        _mculogger.log('Formatting the file system...this will take around ~30s');

        connector.format(function(err, response){
            // finished!
            connector.disconnect();

            if (err){
                _mculogger.error('Formatting failed - ' + err);
            }else{
                // just show complete message
                _mculogger.log('File System created | ' + response);
            }
        });
    });
};

// serial terminal <> console session
Tool.terminal = function(port, baud, initialCommand){
    // create new connector
    var terminal = new _serialTerminal();

    _terminallogger.log('Starting Terminal Mode - press ctrl+c to exit');

    // run initial command before starting terminal session ?
    if (initialCommand){
        terminal.onConnect(function(device){
            device.write(initialCommand + '\n');
        });
    }

    // start
    terminal.passthrough(port, baud, function(err){
        if (err){
            _terminallogger.error(err);
        }else{
            _terminallogger.log('Connection closed');
        }
    });
};

// show serial devices connected to the system
Tool.devices = function(port, baud, showAll, jsonOutput){
    // create new connector
    var connector = new _nodeMcuConnector(port, baud);

    // retrieve the device list (not bound to an opened connection)
    connector.deviceInfo(showAll, function(err, devices){
        if (err){
            _mculogger.error('Cannot retrieve serial device list - ' + err);
        }else{

            if (jsonOutput){
                writeOutput(JSON.stringify(devices));
            }else{
                // just show complete message
                if (devices.length == 0){
                    _mculogger.error('No Connected Devices found | Total: ' + devices.length);
                }else{
                    _mculogger.log('Connected Devices | Total: ' + devices.length);

                    // print fileinfo
                    devices.forEach(function(device){
                        writeOutput('\t  |- ' + device.comName + ' (' + device.manufacturer + ', ' + device.pnpId + ')');
                    });
                }
            }
        }
    });
};


module.exports = Tool;
