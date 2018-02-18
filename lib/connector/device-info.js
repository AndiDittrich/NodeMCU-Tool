const _virtualTerminal = require('../transport/scriptable-serial-terminal');
const _luaCommandBuilder = require('../lua/command-builder');
const _logger = require('logging-facility').getLogger('connector');

// fetch nodemcu device info
async function fetchDeviceInfo(){

    // run the node.info() command
    let {response} = await _virtualTerminal.executeCommand(_luaCommandBuilder.command.nodeInfo);

    // replace whitespaces with single delimiter
    const p = response.replace(/\s+/gi, '-').split('-');

    // 8 elements found ? nodemcu on esp8266
    if (p.length === 8){
        return {
            version: p[0] + '.' + p[1] + '.' + p[2],
            arch: 'esp8266',
            chipID: parseInt(p[3]).toString(16),
            flashID: parseInt(p[4]).toString(16),
            flashsize: p[5] + 'kB',
            flashmode: p[6],
            flashspeed: parseInt(p[7]) / 1000000 + 'MHz'
        };

    // maybe an esp32 module with missing node.info()
    }else{
        try{
            ({response} = await _virtualTerminal.executeCommand(_luaCommandBuilder.command.chipid));

            // esp32 chipid (hex with '0x' prefix)?
            const chipid = response.match(/^0x(\w+)/);

            if (chipid){
                return {
                    version: 'unknown',
                    arch: 'esp32',
                    chipID: chipid[1],
                    flashID: 'unknown',
                    flashsize: 'unknown',
                    flashmode:'unknown',
                    flashspeed: 'unknown'
                };
            }else{
                throw new Error('Invalid node.chipid() Response: ' + response);
            }
        }catch(e){
            _logger.debug(e);
            throw new Error('Invalid node.chipid() Response: ' + response);
        }
    }
}

module.exports = fetchDeviceInfo;

