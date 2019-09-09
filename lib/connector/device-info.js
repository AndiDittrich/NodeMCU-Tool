const _virtualTerminal = require('../transport/scriptable-serial-terminal');
const _luaCommandBuilder = require('../lua/command-builder');
const _logger = require('logging-facility').getLogger('connector');

// get nodemcu >= 3.x info
async function getFullInfo(){
    // fetch hw info
    const {response} = await _virtualTerminal.executeCommand(
        _luaCommandBuilder.prepare('nodeInfo3', ['hw']) + 
        _luaCommandBuilder.prepare('nodeInfo3', ['sw_version']) +
        _luaCommandBuilder.prepare('nodeInfo3', ['build_config'])
    );

    return response;
}

// fetch nodemcu device info
async function fetchDeviceInfo(){

    // run the node.info() command
    let {response} = await _virtualTerminal.executeCommand(_luaCommandBuilder.command.nodeInfoLegacy);

    // replace whitespaces with single delimiter
    const p = response.replace(/\s+/gi, '-').split('-');

    // 8 elements found ? nodemcu on esp8266 v1 + v2
    if (p.length === 8){
        return {
            version: p[0] + '.' + p[1] + '.' + p[2],
            arch: 'esp8266',
            chipID: parseInt(p[3]).toString(16),
            flashID: parseInt(p[4]).toString(16),
            flashsize: p[5] + 'kB',
            flashmode: p[6],
            flashspeed: parseInt(p[7]) / 1000000 + 'MHz',
            modules: null,
            lfssize: null,
            git: null
        };

    // NodeMCU 3 with new node.info() structure ?
    }else if (response.substr(0,6) === 'table:'){

        // fetch full info
        response = await getFullInfo();

        // info object
        const rawDeviceInfo = {};

        // parse info
        response.split('\n').forEach(line => {
            const match = line.match(/^([\w_-]+)\s+(.*)\s*$/);

            // valid line ?
            if (match !== null){
                rawDeviceInfo[match[1]] = match[2];
            }
        });

        return {
            version: rawDeviceInfo['node_version_major'] + '.' + rawDeviceInfo['node_version_minor'] + '.' + rawDeviceInfo['node_version_revision'],
            arch: 'esp8266',
            chipID: parseInt(rawDeviceInfo['chip_id']).toString(16),
            flashID: parseInt(rawDeviceInfo['flash_id']).toString(16),
            flashsize: rawDeviceInfo['flash_size'] + 'kB',
            flashmode: rawDeviceInfo['flash_mode'],
            flashspeed: parseInt(rawDeviceInfo['flash_speed']) / 1000000 + 'MHz',
            modules: rawDeviceInfo['modules'],
            lfssize: rawDeviceInfo['lfs_size'] + 'kB',
            git: rawDeviceInfo['git_branch'] + '#' + rawDeviceInfo['git_commit_id'].substr(0,7)
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
                    flashspeed: 'unknown',
                    modules: null,
                    lfssize: null,
                    git: null
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

