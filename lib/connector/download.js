
// download a file from NodeMCU
NodeMcuConnector.prototype.download = function(remoteName, cb){
    // check connect flag
    if (!this.isConnected){
        cb('Cannot download file - device offline', null);
        return;
    }

    // transfer helper function to encode hex data
    this.device.executeCommand(_luaCommandBuilder.command.transferReadHelper, function(err, echo, response) {
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
            this.device.executeCommand('__nmtread()', function(err, echo, filecontent){
                if (err){
                    cb('Cannot read remote file content - ' + err, null);
                    return;
                }

                // encoding
                var tEncoding = filecontent.match(/^[0-9A-F]+$/gi) ? 'hex' : 'base64';
                _logger.log('Transfer-Encoding: ' + tEncoding);

                // decode file content + detect encoding
                var data = new Buffer(filecontent, tEncoding);

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
