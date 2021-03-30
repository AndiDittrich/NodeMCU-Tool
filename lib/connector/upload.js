const _fs = require('fs-magic');
const _path = require('path');
const _virtualTerminal = require('../transport/scriptable-serial-terminal');
const _luaCommandBuilder = require('../lua/command-builder');
const _logger = require('logging-facility').getLogger('connector');
const _luaMinifier = require('../lua/minifier');

let _transferEncoding = null;

// utility function to handle the file transfer
async function startTransfer(rawContent, localName, remoteName, progressCb){
    // convert buffer to hex or base64
    const content = rawContent.toString(_transferEncoding);

    // get absolute filesize
    const absoluteFilesize = content.length;

    // split file content into chunks
    const chunks = content.match(/[\s\S]{1,232}/g) || [];

    // command response buffer
    let response = null;

    // current upload size in bytes
    let currentUploadSize = 0;

    // open remote file for write
    try{
        ({response} = await _virtualTerminal.executeCommand(_luaCommandBuilder.prepare('fileOpen', [remoteName, 'w+'])));

        // valid handle ?
        if (response == 'nil'){
            throw new Error('i/o error - cannot open nodemcu file-handle for write');
        }
    }catch(e){
        _logger.debug(e);
        throw new Error('Cannot open remote file "' + remoteName + '" for write');
    }

    // initial progress update
    progressCb.apply(progressCb, [0, absoluteFilesize]);

    // internal helper to write chunks
    async function writeChunk(){
        if (chunks.length > 0){
            // get first element
            const l = chunks.shift();

            // increment size counter
            currentUploadSize += l.length;

            // write first element to file
            try{
                await _virtualTerminal.executeCommand('__nmtwrite("' + l + '")');
            }catch(e){
                _logger.debug(e);
                throw new Error('cannot write chunk to remote file');
            }

            // run progress callback
            progressCb.apply(progressCb, [currentUploadSize, absoluteFilesize]);

            // write next
            await writeChunk();

        }else{
            // ensure that the progress callback is called, even for empty files
            progressCb.apply(progressCb, [currentUploadSize, absoluteFilesize]);

            // send file close command
            try{
                await _virtualTerminal.executeCommand(_luaCommandBuilder.command.fileCloseFlush);
            }catch(e){
                _logger.debug(e);
                throw new Error('cannot flush/close remote file');
            }
        }
    }

    // start transfer
    return writeChunk();
}

// utility function to upload file transfer helper
async function requireTransferHelper(){
    let response = null;

    try{
        ({response} = await _virtualTerminal.executeCommand(_luaCommandBuilder.command.transferWriteHelper));

    }catch(e){
        _logger.debug(e);
        throw new Error('cannot upload transfer helper function');
    }

    // get transfer encoding
    if (response == 'b'){
        _transferEncoding = 'base64'
    }else if (response == 'h'){
        _transferEncoding = 'hex'
    }else{
        throw new Error('unknown transfer encoding - ' + response);
    }

    // show encoding
    _logger.log('Transfer-Mode: ' + _transferEncoding);
}

async function upload(localName, remoteName, options, progressCb){

    // get file content
    let rawContent = await _fs.readFile(localName);

    // minify lua file ?
    if (options.minify && _path.extname(localName).toLowerCase() == '.lua'){
        // minify
        rawContent = _luaMinifier.minify(rawContent);
    }

    // ensure the file transfer helper is uploaded
    await requireTransferHelper();

    // start transfer
    await startTransfer(rawContent, localName, remoteName, progressCb);
}

module.exports = upload;