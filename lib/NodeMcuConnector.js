var _virtualTerminal = require('./ScriptableSerialTerminal');
var _serialport = require('serialport');
var _fs = require('fs');
var _path = require('path');
var _luaOptimizer = require('./LuaOptimizer');
var _luaCommandBuilder = require('./LuaCommandBuilder');

// NodeMCU-Connector Context Logger
var _logger = require('logging-facility').getLogger('NodeMCU-Connector');

// constructor
function NodeMcuConnector(devicename, baudrate){
    // new terminal line sequence "\n\r>"
    this.device = new _virtualTerminal([13,10,62]);
    this.errorHandler = null;
    this.isConnected = false;
    this.name = devicename;
    this.baudrate = baudrate;
    this.isHexWriteHelperUploaded = false;

    // handle low level errors
    this.device.onError(function(err){
        // proxy
        if (this.errorHandler){
            this.errorHandler.apply(this, [err]);

        // default: std logger
        }else{
            _logger.error(err);
        }
    }.bind(this));
}

// open the serial connection
NodeMcuConnector.prototype.connect = function(cb, applyConnectionCheck, connectDelay){

    // try to open the device
    this.device.open(this.name, this.baudrate, function(error){
        if (error){
            cb('Cannot open port "' + this.name + '"', null);
        }else{
            // skip connection check ?
            if (applyConnectionCheck === false){
                // set connect flag
                this.isConnected = true;

                // run callback
                cb(null, 'Skipping Connection Check..');
                return;
            }

            var checkConnection = function(){
                this.checkConnection(function(error){
                    if (error){
                        cb(error, null);
                    }else{
                        this.isConnected = true;

                        // print data
                        this.fetchDeviceInfo(function(error, data){
                            if (error){
                                cb(error, null);
                            }else{
                                // show nodemcu device info
                                cb(null, 'Version: ' + data.version + ' | ChipID: 0x' + data.chipID + ' | FlashID: 0x' + data.flashID);
                            }
                        });
                    }
                }.bind(this));
            }.bind(this);

            // delay the connection process ? may fix issues related to rebooting modules
            if (connectDelay && connectDelay > 1){
                setTimeout(function(){

                    // send dummy sequence
                    this.device.write('\n\n\n'  + _luaCommandBuilder.command.echo + '\n\n\n' , function(){

                        // wait 1/3 to get the dummy sequence processed
                        setTimeout(function(){

                            // send dummy sequence
                            this.device.write('\n\n\n'  + _luaCommandBuilder.command.echo + '\n\n\n' , function(){

                                // wait 1/3 to get the dummy sequence processed
                                setTimeout(function(){

                                    // purge received data
                                    this.device.purge(function(){
                                        // connection startup
                                        checkConnection();
                                    }.bind(this));

                                }.bind(this), connectDelay);

                            }.bind(this));

                        }.bind(this), connectDelay);

                    }.bind(this));

                // 2/3 timeout
                }.bind(this), connectDelay);
            }else{
                checkConnection();
            }
        }
    }.bind(this));
};

// close the serial connection
NodeMcuConnector.prototype.disconnect = function(){
    this.isConnected = false;
    this.device.close();
};

// set main error handler
NodeMcuConnector.prototype.onError = function(cb){
    this.errorHandler = cb;
};

// checks the node-mcu connection
NodeMcuConnector.prototype.checkConnection = function(cb){

    // 1.5s connection timeout
    var watchdog = setTimeout(function(){
        // stop
        watchdog = null;

        // throw error
        cb('Timeout, no response detected - is NodeMCU online and the Lua interpreter ready ?');
    }, 1500);

    // proxy function to stop timer
    var ready = function(err){
        // watchdog active ?
        if (watchdog !== null){
            // stop watchdog
            clearTimeout(watchdog);

            // run callback
            cb(err);
        }
    };

    // send a simple print command to the lua engine
    this.device.executeCommand(_luaCommandBuilder.command.echo, function(err, echo, output){
        if (err){
            ready(err);
        }else{
            // validate command echo and command output
            if (output == 'echo1337' && echo == 'print("echo1337")') {
                ready(null);
            } else {
                ready('No response detected - is NodeMCU online and the Lua interpreter ready ?')
            }
        }
    });
};

// fetch nodemcu device info
NodeMcuConnector.prototype.fetchDeviceInfo = function(cb){
    // run the node.info() command
    this.device.executeCommand(_luaCommandBuilder.command.nodeInfo, function(err, echo, data){
        if (err){
            cb(err);
        }else {
            // replace whitespaces with single delimiter
            var p = data.replace(/\s+/gi, '-').split('-');

            if (p.length != 8) {
                cb('Invalid node.info() Response: ' + data, null);
            } else {
                // process data
                cb(null, {
                    version: p[0] + '.' + p[1] + '.' + p[2],
                    chipID: parseInt(p[3]).toString(16),
                    flashID: parseInt(p[4]).toString(16),
                    flashsize: p[5] + 'kB',
                    flashmode: p[6],
                    flashspeed: parseInt(p[7]) / 1000000 + 'MHz'
                });
            }
        }
    });
};

// upload a local file to NodeMCU
/**
 * Upload a local file to NodeMCU
 * @param localName the original filename
 * @param remoteName the destination name
 * @param options
 * @param completeCb
 * @param progressCb
 */
NodeMcuConnector.prototype.upload = function(localName, remoteName, options, completeCb, progressCb){
  
    // check connect flag
    if (!this.isConnected){
        completeCb('Cannot upload file - device offline', null);
        return;
    }

    // get file content
    var rawContent = _fs.readFileSync(localName);

    // remove lua comments and empty lines ?
    if (options.optimize && _path.extname(localName).toLowerCase() == '.lua'){
        // apply optimizations
        rawContent = _luaOptimizer.optimize(rawContent);
    }

    // convert buffer to hex
    var content = rawContent.toString('hex');

    // get absolute filesize
    var absoluteFilesize = rawContent.length;

    // split file content into chunks
    var chunks = content.match(/.{1,232}/g);

    // wrapper to start the transfer
    var startTransfer = function(){
        // open remote file for write
        this.device.executeCommand(_luaCommandBuilder.prepare('fileOpen', [remoteName, 'w+']), function(err, echo, response){
            // successful opened ?
            if (err || response == 'nil'){
                completeCb('Cannot open remote file "' + remoteName + '" for write - ' + err);
                return;
            }

            var currentUploadSize = 0;

            // initial progress update
            progressCb.apply(progressCb, [0, absoluteFilesize]);

            var writeChunk = function(){
                if (chunks.length > 0){
                    // get first element
                    var l = chunks.shift();

                    // increment size counter
                    currentUploadSize += l.length/2 ;

                    // write first element to file
                    this.device.executeCommand('__hexwrite("' + l + '")', function(err, echo, response){
                        if (err){
                            completeCb('Cannot write chunk to remote file - ' + err, null);
                            return;
                        }

                        // run progress callback
                        progressCb.apply(progressCb, [currentUploadSize, absoluteFilesize]);

                        // write next line
                        writeChunk();
                    });
                }else{
                    // send file close command
                    this.device.executeCommand(_luaCommandBuilder.command.fileCloseFlush, function(err, echo, response){
                        if (err){
                            completeCb('Cannot flush/close remote file - ' + err, null);
                        }else{
                            completeCb(null, absoluteFilesize);
                        }

                    });
                }

            }.bind(this);

            // start transfer
            writeChunk();

        }.bind(this));
    }.bind(this);


    // hex write helper already uploaded within current session ?
    if (this.isHexWriteHelperUploaded){
        // start transfer directly
        startTransfer();

    // otherwise upload helper
    }else{
        // transfer helper function to decode hex data
        this.device.executeCommand(_luaCommandBuilder.command.hexWriteHelper, function(err, echo, response) {
            // successful opened ?
            if (err) {
                completeCb('Cannot transfer hex.decode helper function - ' + err);
                return;
            }

            // set flag
            this.isHexWriteHelperUploaded = true;

            // start file transfer on upload complete
            startTransfer();
        });
    }
};

// show filesystem information
NodeMcuConnector.prototype.fsinfo = function(cb){
    // check connect flag
    if (!this.isConnected){
        cb('Cannot fetch file system info - device offline', null);
        return;
    }

    // get file system info (size)
    this.device.executeCommand(_luaCommandBuilder.command.fsInfo, function(err, echo, response){
        if (err){
            cb('Cannot fetch file system metadata - ' + err, null);
            return;
        }

        // extract size (remaining, used, total)
        response = response.replace(/\s+/gi, '-').split('-');

        var toKB = function(s){
            return parseInt((parseInt(s)/1024));
        };

        var meta = {
            remaining: toKB(response[0]),
            used: toKB(response[1]),
            total: toKB(response[2])
        };

        // print a full file-list including size
        this.device.executeCommand(_luaCommandBuilder.command.listFiles, function(err, echo, response){
            if (err){
                cb('Cannot obtain file-list - ' + err, null);
                return;
            }

            // file-list to return
            var files = [];

            // files available (list not empty) ?
            if (response.length > 0){
                // split the file-list by ";"
                var entries = response.trim().split(';');

                // process each entry
                entries.forEach(function(entry){
                    // entry format: <name>:<size>
                    var matches = /^(.*):(\d+)$/gi.exec(entry);

                    // valid format ?
                    if (matches){
                        // append file entry to list
                        files.push({
                            name: matches[1],
                            size: parseInt(matches[2])
                        });
                    }
                });
            }

            // run callback
            cb(null, meta, files);
        });
    }.bind(this));
};

// delete a file from remote filesystem
NodeMcuConnector.prototype.removeFile = function(remoteName, cb){
    // check connect flag
    if (!this.isConnected){
        cb('Cannot remove remote file - device offline', null);
        return;
    }

    // get file system info (size)
    this.device.executeCommand(_luaCommandBuilder.prepare('fileRemove', [remoteName]), function(err, echo, response){
        if (err){
            cb('IO Error - ' + err, null);
        }else{
            cb(null, response);
        }
    }.bind(this));
};

// format the filesystem
NodeMcuConnector.prototype.format = function(cb){
    // check connect flag
    if (!this.isConnected){
        cb('Cannot format file system - device offline', null);
        return;
    }

    // get file system info (size)
    this.device.executeCommand(_luaCommandBuilder.command.fsFormat, function(err, echo, response){
        if (err){
            cb('IO Error - ' + err, null);
        }else{
            cb(null, response);
        }
    }.bind(this));
};

// compile a remote file
NodeMcuConnector.prototype.compile = function(remoteName, cb){
    // check connect flag
    if (!this.isConnected){
        cb('Cannot compile remote file - device offline', null);
        return;
    }

    // run the lua compiler/interpreter to cache the file as bytecode
    this.device.executeCommand(_luaCommandBuilder.prepare('compile', [remoteName]), function(err, echo, response){
        if (err){
            cb('IO Error - ' + err, null);
        }else{
            cb(null, response);
        }
    }.bind(this));
};

// execute a remote file
NodeMcuConnector.prototype.run = function(remoteName, cb){
    // check connect flag
    if (!this.isConnected){
        cb('Cannot execute remote file - device offline', null);
        return;
    }

    // run the lua compiler/interpreter to cache the file as bytecode
    this.device.executeCommand(_luaCommandBuilder.prepare('run', [remoteName]), function(err, echo, response){
        if (err){
            cb('IO Error - ' + err, null);
        }else{
            cb(null, response);
        }

    }.bind(this));
};

// LOW LEVEL - run a lua command directly
NodeMcuConnector.prototype.executeCommand = function(cmd, cb){
    // check connect flag
    if (!this.isConnected){
        cb('Cannot execute remote file - device offline', null);
        return;
    }

    // run the lua interpreter
    this.device.executeCommand(cmd, cb);
};


// download a file from NodeMCU
NodeMcuConnector.prototype.download = function(remoteName, cb){
    // check connect flag
    if (!this.isConnected){
        cb('Cannot download file - device offline', null);
        return;
    }

    // transfer helper function to encode hex data
    this.device.executeCommand(_luaCommandBuilder.command.hexReadHelper, function(err, echo, response) {
        // successful opened ?
        if (err) {
            cb('Cannot transfer hex.encode helper function - ' + err);
            return;
        }

        // open remote file for write
        this.device.executeCommand(_luaCommandBuilder.prepare('fileOpen', [remoteName, 'r']), function(err, echo, response){
            // successful opened ?
            if (err || response == 'nil'){
                cb('Cannot open remote file "' + remoteName + '" for read - ' + err);
                return;
            }

            // write first element to file
            this.device.executeCommand('__hexread()', function(err, echo, filecontent){
                if (err){
                    cb('Cannot read remote file content - ' + err, null);
                    return;
                }

                // decode file content
                var data = new Buffer(filecontent, 'hex');

                // send file close command
                this.device.executeCommand(_luaCommandBuilder.command.fileClose, function(err, echo, response){
                    if (err){
                        cb('Cannot close remote file - ' + err, null);
                    }else{
                        cb(null, data);
                    }
                });

            }.bind(this));

        }.bind(this));

    }.bind(this));
};

// show connected serial devices
NodeMcuConnector.prototype.deviceInfo = function(showAll, cb){
    // get all available serial ports
    _serialport.list(function (err, ports){
        // error occurred ?
        if (err){
            cb(err);
            return;
        }

        // default condition
        ports = ports || [];

        // just pass-through
        if (showAll){
            cb(null, ports);

            // filter by vendorIDs
            // NodeMCU v1.0 - CH341 Adapter | 0x1a86  QinHeng Electronics
            // NodeMCU v1.1 - CP2102 Adapter | 0x10c4  Cygnal Integrated Products, Inc
        }else{
            cb(null, ports.filter(function(item){
                return (item.vendorId == '0x1a86' || item.vendorId == '0x10c4');
            }));
        }
    });
};

// reset NodeMCU devkit - compatible with devices using rts/dtr reset/programming circuit
// @see https://github.com/nodemcu/nodemcu-devkit-v1.0/blob/master/NODEMCU_DEVKIT_V1.0.PDF Page #3
// Reset => DTR=1, RTS=0
NodeMcuConnector.prototype.reset = function(cb){
    // check connect flag
    if (!this.isConnected){
        cb('Cannot reset module - device offline', null);
        return;
    }

    var d = this.device;

    // pull down RST pin using the reset circuit
    d.flowcontrol({
        dtr: false,
        rts: true
    }, function(err){
        if (err){
            cb(err);

            // restore previous state after 100ms
        }else{
            setTimeout(function(){
                d.flowcontrol({
                    dtr: false,
                    rts: false
                }, cb);
            }, 100);
        }
    });
};

// Software Reset using node.restart() command
NodeMcuConnector.prototype.softreset = function(cb){
    // check connect flag
    if (!this.isConnected){
        cb('Cannot reset module - device offline', null);
        return;
    }

    // transfer helper function to encode hex data
    this.device.executeCommand(_luaCommandBuilder.command.reset, function(err, echo, response) {
        // successful opened ?
        if (err) {
            cb('Cannot execute soft-reset command - ' + err);
            return;
        }

        cb(null);
    });
};

module.exports = NodeMcuConnector;
