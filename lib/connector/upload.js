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
    if (options.minify && _path.extname(localName).toLowerCase() == '.lua'){
        // minify
        rawContent = _luaMinifier.minify(rawContent);
    }

    // wrapper to start the transfer
    var startTransfer = function(){
        // convert buffer to hex or base64
        var content = rawContent.toString(this.transferEncoding);

        // get absolute filesize
        var absoluteFilesize = content.length;

        // split file content into chunks
        var chunks = content.match(/[\s\S]{1,232}/g) || [];

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
                    currentUploadSize += l.length;

                    // write first element to file
                    this.device.executeCommand('__nmtwrite("' + l + '")', function(err, echo, response){
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
                    // ensure that the progress callback is called, even for empty files  
                    progressCb.apply(progressCb, [currentUploadSize, absoluteFilesize]);

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
    if (this.isTransferWriteHelperUploaded){
        // start transfer directly
        startTransfer();

    // otherwise upload helper
    }else{
        // transfer helper function to decode hex data
        this.device.executeCommand(_luaCommandBuilder.command.transferWriteHelper, function(err, echo, response) {
            // successful opened ?
            if (err) {
                completeCb('Cannot transfer hex.decode helper function - ' + err);
                return;
            }

            // get transfer encoding
            if (response == 'b'){
                this.transferEncoding = 'base64'
            }else if (response == 'h'){
                this.transferEncoding = 'hex'
            }else{
                complteCb('Unknown transfer encoding - ' + response);
            }

            // show encoding
            _logger.log('Transfer-Mode: ' + this.transferEncoding);

            // set flag
            this.isTransferWriteHelperUploaded = true;

            // start file transfer on upload complete
            startTransfer();
        }.bind(this));
    }
};