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
        this.throwError(error);
    }.bind(this));
}

// open the serial connection
NodeMcuConnector.prototype.connect = function(cb){
    // try to open the device
    this.device.open(this.name, this.baudrate, function(error){
        if (error){
            console.error('[NodeMcuConnector] Cannot open port "' + this.name + '"');

            // show available ports
            _serialport.list(function (err, ports){
                console.log('\n[NodeMcuConnector] Available Devices:')
                ports.forEach(function(port) {
                    console.log('- ' + port.comName + ' (' + port.pnpId + ')');
                });
                console.log('');
            });
        }else{
            console.log('[NodeMcuConnector] Connecting..');

            this.checkConnection(function(error){
                if (error){
                    this.throwError(error);
                }else{
                    console.log('[NodeMcuConnector] ONLINE. Fetching device data..');
                    this.isConnected = true;

                    // print data
                    this.fetchDeviceInfo(function(error, data){
                        if (error){
                            console.log(error);
                        }else{
                            // show nodemcu device info
                            console.log('[NodeMCU] Version: ' + data.version + ' | ChipID: 0x' + data.chipID + ' | FlashID: 0x' + data.flashID);

                            // run callback (secure scope to ensure a stable connection)
                            cb.apply(this);
                        }
                    });
                }
            }.bind(this));
        }
    }.bind(this));
};

// throws an fatal error and close the connection
NodeMcuConnector.prototype.throwError = function(message){
    this.disconnect();

    // proxy
    if (this.errorHandler){
        this.errorHandler.apply(this, [message]);
    }
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
    this.device.executeCommand('print("echo1337")', function(echo, output){
        // validate command echo and command output
        if (output == 'echo1337' && echo == 'print("echo1337")'){
            cb(false);
        }else{
            cb('No response detected - is NodeMCU online and the LUA interpreter ready ?')
        }
    });
};

// fetch nodemcu device info
NodeMcuConnector.prototype.fetchDeviceInfo = function(cb){
    // run the node.info() command
    this.device.executeCommand('print(node.info());', function(echo, data){
        // replace whitespaces with single delimiter
        var p = data.replace(/\s+/gi, '-').split('-');

        if (p.length != 8){
            cb('Invalid node.info() Response: ' + data, null);
        }else {
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
    });
};

// upload a local file to NodeMCU
NodeMcuConnector.prototype.upload = function(filename, stripComments, completeCb, progressCb){
    // check connect flag
    if (!this.isConnected){
        this.throwError('[NodeMcuConnector] Cannot upload file - device offline');
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
            this.throwError('[NodeMcuConnector] File contains a line (' + i + ') with more than 235 Chars. The serial buffer has a limited size of 256 chars.');
            return;
        }
    }

    console.log('[NodeMcuConnector] Uploading "' + remoteFilename + '" (' + absoluteFilesize + ' Bytes)');

    // drop file (override)
    this.device.executeCommand('file.remove("' + remoteFilename + '")', function(){

        // open remote file for write
        this.device.executeCommand('file.open("' + remoteFilename + '", "w+")', function(){
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
                    this.device.executeCommand('file.writeline([===[' + l + ']===])', function(){

                        // run progress callback
                        progressCb.apply(progressCb, [currentUploadSize, absoluteFilesize]);

                        // write next line
                        writeLine();
                    });
                }else{
                    // send file close command
                    this.device.executeCommand('file.flush() file.close()', function(){
                        completeCb.apply(completeCb, [absoluteFilesize]);
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
    // get file system info (size)
    this.device.executeCommand('print(file.fsinfo())', function(echo, response){
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
        this.device.executeCommand('local l = file.list();for k,v in pairs(l) do uart.write(0,k..":"..v..";") end print("")', function(echo, response){

            if (response.length == 0){
                cb({});
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
                cb(meta, files);
            }
        });
    }.bind(this));
};

// delete a file from remote filesystem
NodeMcuConnector.prototype.removeFile = function(filename, cb){
    // drop path from filename
    filename =_path.basename(filename);
    // filter
    //filename = filename.replace(/(\.\.|\/)/gi, '');

    // get file system info (size)
    this.device.executeCommand('file.remove("' + filename + '")', function(echo, response){
        cb(response);
    }.bind(this));
};

// format the filesystem
NodeMcuConnector.prototype.format = function(cb){
    // get file system info (size)
    this.device.executeCommand('file.format()', function(echo, response){
        cb(response);
    }.bind(this));
};

// compile a remote file
NodeMcuConnector.prototype.compile = function(filename, cb){
    // drop path from filename
    filename =_path.basename(filename);

    // run the lua compiler/interpreter to cache the file as bytecode
    this.device.executeCommand('node.compile("' + filename + '")', function(echo, response){
        cb(response);
    }.bind(this));
};

// execute a remote file
NodeMcuConnector.prototype.run = function(filename, cb){
    // drop path from filename
    filename =_path.basename(filename);

    // run the lua compiler/interpreter to cache the file as bytecode
    this.device.executeCommand('dofile("' + filename + '")', function(echo, response){
        cb(response);
    }.bind(this));
};

// simple serial terminal - redirect stdin and stdout
NodeMcuConnector.prototype.terminal = function(cb){
    // drop path from filename
    filename =_path.basename(filename);

    // run the lua compiler/interpreter to cache the file as bytecode
    this.device.executeCommand('node.compile("' + filename + '")', function(echo, response){
        cb(response);
    }.bind(this));
};

module.exports = NodeMcuConnector;