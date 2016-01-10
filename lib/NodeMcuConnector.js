var _virtualTerminal = require('./ScriptableSerialTerminal');
var _serialport = require('serialport');
var _fs = require('fs');
var _path = require('path');

// lua command templates - central location for easier debugging
var lua_commands = {
    // connection info echo command,
    echo: 'print("echo1337")',

    // info command (flash id)
    nodeInfo: 'print(node.info());',

    // file system info
    fsInfo: 'print(file.fsinfo())',

    // format the file system
    fsFormat: 'file.format()',

    // compile a remote file
    compile: 'node.compile("?")',

    // run a file
    run: 'dofile("?")',

    // list files on SPIFFS
    listFiles: 'local l = file.list();for k,v in pairs(l) do uart.write(0,k..":"..v..";") end print("")',

    // file open
    fileOpen: 'print(file.open("?", "?"))',

    // close a opened file
    fileClose: 'file.close()',

    // remove file
    fileRemove: 'file.remove("?")',

    // file close & flush
    fileCloseFlush: 'file.flush() file.close()',

    // helper function to write hex encoded content to file
    hexWriteHelper: "function __hexwrite(s) for c in s:gmatch('..') do file.write(string.char(tonumber(c, 16))) end end",

    // helper function to read file as hex and write content to uart
    hexReadHelper: "function __hexread() while true do c = file.read(1) if c == nil then print('') break end uart.write(0, string.format('%02X', string.byte(c))) end end"
};

// prepare command be escaping args
var luaPrepare = function(command, args){
    // replace all placeholders with given args
    args.forEach(function(arg){
        // simple escaping quotes
        arg = arg.replace(/[^\\]"/g, '\"');

        // apply arg
        command = command.replace(/\?/, arg);
    });

    return command;
};

function NodeMcuConnector(devicename, baudrate){
    // new terminal line sequence "\n\r>"
    this.device = new _virtualTerminal([13,10,62]);
    this.errorHandler = null;
    this.isConnected = false;
    this.name = devicename;
    this.baudrate = baudrate;

    // handle low level errors
    this.device.onError(function(error){
        // proxy
        if (this.errorHandler){
            this.errorHandler.apply(this, [error]);
        }
    }.bind(this));
}

// open the serial connection
NodeMcuConnector.prototype.connect = function(cb){
    // try to open the device
    this.device.open(this.name, this.baudrate, function(error){
        if (error){
            cb('Cannot open port "' + this.name + '"', null);

            // show available ports
            _serialport.list(function (err, ports){
                console.log('Available Serial Devices:')
                ports.forEach(function(port) {
                    console.log(' |- ' + port.comName + ' (' + port.pnpId + ')');
                });
                console.log('');
            });
        }else{
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
    // send a simple print command to the lua engine
    this.device.executeCommand(lua_commands.echo, function(err, echo, output){
        if (err){
            cb(err);
        }else{
            // validate command echo and command output
            if (output == 'echo1337' && echo == 'print("echo1337")') {
                cb(null);
            } else {
                cb('No response detected - is NodeMCU online and the LUA interpreter ready ?')
            }
        }
    });
};

// fetch nodemcu device info
NodeMcuConnector.prototype.fetchDeviceInfo = function(cb){
    // run the node.info() command
    this.device.executeCommand(lua_commands.nodeInfo, function(err, echo, data){
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
NodeMcuConnector.prototype.upload = function(filename, optimize, completeCb, progressCb){
    // check connect flag
    if (!this.isConnected){
        completeCb('Cannot upload file - device offline', null);
        return;
    }

    // drop path from filename
    var remoteFilename =_path.basename(filename);

    // get file content
    var rawContent = _fs.readFileSync(filename);

    // remove lua comments and empty lines ?
    if (optimize && _path.extname(filename).toLowerCase() == '.lua'){
        // apply optimizations
        var t = rawContent.toString('utf-8')
            .replace(/--.*$/gim, '')
            .replace(/(\r\n|\n\r|\n|\r)+/g, '$1')
            .replace(/^\s+/gm, '')
            .trim();

        // re-convert to buffer
        rawContent = new Buffer(t, 'utf-8');
    }

    // convert buffer to hex
    var content = rawContent.toString('hex');

    // get absolute filesize
    var absoluteFilesize = rawContent.length;

    // split file content into chunks
    var chunks = content.match(/.{1,232}/g);

    // drop file (override)
    this.device.executeCommand(luaPrepare(lua_commands.fileRemove, [remoteFilename]), function(err, echo, response){

        // successful removed ?
        if (err){
            completeCb('Cannot remove file "' + remoteFilename + '" - ' + err);
            return;
        }

        // transfer helper function to decode hex data
        this.device.executeCommand(lua_commands.hexWriteHelper, function(err, echo, response) {
            // successful opened ?
            if (err) {
                completeCb('Cannot transfer hex.decode helper function - ' + err);
                return;
            }

            // open remote file for write
            this.device.executeCommand(luaPrepare(lua_commands.fileOpen, [remoteFilename, 'w+']), function(err, echo, response){
                // successful opened ?
                if (err || response != 'true'){
                    completeCb('Cannot open remote file "' + remoteFilename + '" for write - ' + err);
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
                        this.device.executeCommand(lua_commands.fileCloseFlush, function(err, echo, response){
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

        }.bind(this));



    }.bind(this));
};


// show filesystem information
NodeMcuConnector.prototype.fsinfo = function(cb){
    // check connect flag
    if (!this.isConnected){
        cb('Cannot fetch file system info - device offline', null);
        return;
    }

    // get file system info (size)
    this.device.executeCommand(lua_commands.fsInfo, function(err, echo, response){
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
        this.device.executeCommand(lua_commands.listFiles, function(err, echo, response){
            if (err){
                cb('Cannot obtain file-list - ' + err, null);
                return;
            }

            if (response.length == 0){
                cb(null, meta, {});
            }else{
                var entries = response.trim().split(';');

                var files = [];

                entries.forEach(function(entry){
                    var matches = /^(.*):(\d+)$/gi.exec(entry);

                    if (matches){
                        files.push({
                            name: matches[1],
                            size: parseInt(matches[2])
                        });
                    }
                });

                // run callback
                cb(null, meta, files);
            }
        });
    }.bind(this));
};

// delete a file from remote filesystem
NodeMcuConnector.prototype.removeFile = function(filename, cb){
    // check connect flag
    if (!this.isConnected){
        cb('Cannot remove remote file - device offline', null);
        return;
    }

    // drop path from filename
    filename =_path.basename(filename);

    // get file system info (size)
    this.device.executeCommand(luaPrepare(lua_commands.fileRemove, [filename]), function(err, echo, response){
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
    this.device.executeCommand(lua_commands.fsFormat, function(err, echo, response){
        if (err){
            cb('IO Error - ' + err, null);
        }else{
            cb(null, response);
        }
    }.bind(this));
};

// compile a remote file
NodeMcuConnector.prototype.compile = function(filename, cb){
    // check connect flag
    if (!this.isConnected){
        cb('Cannot compile remote file - device offline', null);
        return;
    }

    // drop path from filename
    filename =_path.basename(filename);

    // run the lua compiler/interpreter to cache the file as bytecode
    this.device.executeCommand(luaPrepare(lua_commands.compile, [filename]), function(err, echo, response){
        if (err){
            cb('IO Error - ' + err, null);
        }else{
            cb(null, response);
        }
    }.bind(this));
};

// execute a remote file
NodeMcuConnector.prototype.run = function(filename, cb){
    // check connect flag
    if (!this.isConnected){
        cb('Cannot execute remote file - device offline', null);
        return;
    }

    // drop path from filename
    filename =_path.basename(filename);

    // run the lua compiler/interpreter to cache the file as bytecode
    this.device.executeCommand(luaPrepare(lua_commands.run, [filename]), function(err, echo, response){
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
NodeMcuConnector.prototype.download = function(filename, cb){
    // check connect flag
    if (!this.isConnected){
        cb('Cannot upload file - device offline', null);
        return;
    }

    // drop path from filename...
    var remoteFilename =_path.basename(filename);

    // transfer helper function to encode hex data
    this.device.executeCommand(lua_commands.hexReadHelper, function(err, echo, response) {
        // successful opened ?
        if (err) {
            cb('Cannot transfer hex.encode helper function - ' + err);
            return;
        }

        // open remote file for write
        this.device.executeCommand(luaPrepare(lua_commands.fileOpen, [remoteFilename, 'r']), function(err, echo, response){
            // successful opened ?
            if (err || response != 'true'){
                cb('Cannot open remote file "' + remoteFilename + '" for read - ' + err);
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
                this.device.executeCommand(lua_commands.fileClose, function(err, echo, response){
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

module.exports = NodeMcuConnector;