const _virtualTerminal = require('../transport/scriptable-serial-terminal');
const _luaCommandBuilder = require('../lua/command-builder');

// delete a file from remote filesystem
async function removeFile(remoteName){
    // remove a file from nodemcu flash
    const {response} = await _virtualTerminal.executeCommand(_luaCommandBuilder.prepare('fileRemove', [remoteName]));
    return response;
}

module.exports = removeFile;

