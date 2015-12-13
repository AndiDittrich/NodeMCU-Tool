var _virtualTerminal = require('./ScriptableSerialTerminal');
var _serialport = require('serialport');
var _fs = require('fs');
var _path = require('path');

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
    this.device.executeCommand('print("echo1337")', function(err, echo, output){
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
    this.device.executeCommand('print(node.info());', function(err, echo, data){
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
NodeMcuConnector.prototype.upload = function(filename, stripComments, completeCb, progressCb){
    // check connect flag
    if (!this.isConnected){
        completeCb('Cannot upload file - device offline', null);
        return;
    }

    // drop path from filename
    var remoteFilename =_path.basename(filename);

    // get file content
    var content = _fs.readFileSync(filename).toString('utf8');

    // remove lua comments and empty lines ?
    if (stripComments){
        content = content
            .replace(/--.*$/gim, '')
            .replace(/(\r\n|\n\r|\n|\r)+/g, '$1')
            .trim();
    }

    // get absolute filesize
    var absoluteFilesize = content.length;

    // split file content into lines
    content = content.split('\n');

    // check line size (serial buffer is set to 256byte)
    for (var i=0;i<content.length;i++){
        // char limit: 256 - 27 (command string overhead)
        if (content[i].length > 235){
            completeCb('File contains a line (' + i + ') with more than 235 Chars. The serial buffer has a limited size of 256 chars.', null);
            return;
        }
    }

    //console.log('[NodeMcuConnector] Uploading "' + remoteFilename + '" (' + absoluteFilesize + ' Bytes)');

    // drop file (override)
    this.device.executeCommand('file.remove("' + remoteFilename + '")', function(err, echo, response){

        // successful removed ?
        if (err){
            completeCb('Cannot remove file "' + remoteFilename + '" - ' + err);
            return;
        }

        // open remote file for write
        this.device.executeCommand('file.open("' + remoteFilename + '", "w+")', function(err, echo, response){
            // successful opened ?
            if (err){
                completeCb('Cannot open remote file "' + remoteFilename + '" for write - ' + err);
                return;
            }

            var currentUploadSize = 0;

            // initial progress update
            progressCb.apply(progressCb, [0, absoluteFilesize]);

            var writeLine = function(){
                if (content.length > 0){
                    // get first element
                    var l = content.shift();

                    // increment size counter
                    currentUploadSize += l.length + 1;

                    // write first element to file
                    this.device.executeCommand('file.writeline([===[' + l + ']===])', function(err, echo, response){
                        if (err){
                            completeCb('Cannot write to remote file - ' + err, null);
                            return;
                        }

                        // run progress callback
                        progressCb.apply(progressCb, [currentUploadSize, absoluteFilesize]);

                        // write next line
                        writeLine();
                    });
                }else{
                    // send file close command
                    this.device.executeCommand('file.flush() file.close()', function(err, echo, response){
                        if (err){
                            completeCb('Cannot flush/close remote file - ' + err, null);
                        }else{
                            completeCb(null, absoluteFilesize);
                        }

                    });
                }

            }.bind(this);

            // start transfer
            writeLine();

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
    this.device.executeCommand('print(file.fsinfo())', function(err, echo, response){
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
        this.device.executeCommand('local l = file.list();for k,v in pairs(l) do uart.write(0,k..":"..v..";") end print("")', function(err, echo, response){
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
    this.device.executeCommand('file.remove("' + filename + '")', function(err, echo, response){
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
    this.device.executeCommand('file.format()', function(err, echo, response){
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
    this.device.executeCommand('node.compile("' + filename + '")', function(err, echo, response){
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
    this.device.executeCommand('dofile("' + filename + '")', function(err, echo, response){
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

module.exports = NodeMcuConnector;