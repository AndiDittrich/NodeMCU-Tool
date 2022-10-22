const _virtualTerminal = require('../transport/scriptable-serial-terminal');
const _luaCommandBuilder = require('../lua/command-builder');

function toKB(s){
    return parseInt((parseInt(s)/1024));
}

// show filesystem information
async function fsinfo(){

    // get file system info (size)
    let {response} = await _virtualTerminal.executeCommand(_luaCommandBuilder.command.fsInfo);

    // extract size (remaining, used, total)
    response = response.replace(/\s+/gi, '-').split('-');

    const meta = {
        remaining: toKB(response[0]),
        used: toKB(response[1]),
        total: toKB(response[2])
    };

    // print a full file-list including size
    ({response} = await _virtualTerminal.executeCommand(_luaCommandBuilder.command.listFiles));

    // file-list to return
    const files = [];

    // files available (list not empty) ?
    if (response.length > 0){
        // split the file-list by ";"
        let entries = response.trim().split(';');
				
				// Due to an error in the dev-esp32-idf4 branch - file.list() always returns filesize = 0
				// we have to get the correct file size using getFileSize command
				if (_luaCommandBuilder.getArch() === "esp32") {
						const filesArray = [];
						const filtered = entries.filter(f => f.includes(':'));
					
						for (const fnfs of filtered) {
								const fileData = fnfs.split(':');
								({response} = await _virtualTerminal.executeCommand(_luaCommandBuilder.prepare('getFileSize', [fileData[0]])));
								fileData[1] = response
								filesArray.push(fileData.join(':'));
						}
						entries = filesArray
				}

        // process each entry
        entries.forEach(function(entry){
            // entry format: <name>:<size>
            const matches = /^(.*):(\d+)$/gi.exec(entry);

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

    return {metadata: meta, files: files}
}

module.exports = fsinfo;