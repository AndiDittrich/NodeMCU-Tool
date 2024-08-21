const _virtualTerminal = require('../transport/scriptable-serial-terminal');
const _luaCommandBuilder = require('../lua/command-builder');
const _logger = require('logging-facility').getLogger('connector');

// download a file from NodeMCU
async function download(remoteName){

    let response = null;
    let data = null;

    // transfer helper function to encode hex data
    try{
        ({response} = await _virtualTerminal.executeCommand(_luaCommandBuilder.command.transferReadHelper));
    }catch(e){
        _logger.debug(e);
        throw new Error('Cannot transfer hex.encode helper function');
    }

    // open remote file for read
    try{
        ({response} = await _virtualTerminal.executeCommand(_luaCommandBuilder.prepare('fileOpen', [remoteName, 'r'])));
    }catch(e){
        _logger.debug(e);
        throw new Error('Cannot open remote file "' + remoteName + '" for read');
    }

    // read content
    try{
        ({response} = await _virtualTerminal.executeCommand(_luaCommandBuilder.command.fileRead));

        // encoding
        const tEncoding = response.match(/^[0-9A-F]+$/gi) ? 'hex' : 'base64';
        _logger.log('Transfer-Encoding: ' + tEncoding);

        // decode file content + detect encoding
        data = new Buffer.from(response, tEncoding);
    }catch(e){
        _logger.debug(e);
        throw new Error('Cannot read remote file content');
    }

    // close remote file for read
    try{
        ({response} = await _virtualTerminal.executeCommand(_luaCommandBuilder.command.fileClose));
    }catch(e){
        _logger.debug(e);
        throw new Error('Cannot close remote file "' + remoteName + '"');
    }

    return data;
}

module.exports = download;
