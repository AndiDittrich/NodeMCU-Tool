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
            model: 'esp8266',
            chipID: parseInt(p[3]).toString(16),
            flashID: parseInt(p[4]).toString(16),
            flashsize: p[5] + 'kB',
            flashmode: p[6],
            flashspeed: parseInt(p[7]) / 1000000 + 'MHz',
            modules: null,
            lfssize: null,
            git: null
        };
    }

    // info object
    const rawDeviceInfo = {};

    // latest esp32 FW with node.info("hw"); hw.chip_model: esp32 | esp32xx
    let isNewEsp32fw = false;

    // NodeMCU 3 with new node.info() structure or latest esp32 FW with node.info()?
    if (response.substr(0,6) === 'table:'){

        // fetch full info
        response = await getFullInfo();

        // parse info
        response.split('\n').forEach(line => {
            const match = line.match(/^([\w_-]+)\s+(.*)\s*$/);

            // valid line ?
            if (match !== null){
                rawDeviceInfo[match[1]] = match[2];
            }
        });

        // new esp32xx FW with node.info()?
        isNewEsp32fw = response.includes('chip_model');
    }

    // esp32 chipid (hex with '0x' prefix)
    ({response} = await _virtualTerminal.executeCommand(_luaCommandBuilder.command.chipid));
    const chipid = response.match(/^0x(\w+)/);

    if (!isNewEsp32fw && !chipid) {
        // esp8266 NodeMCU 3 with new node.info() structure
        return {
            version: rawDeviceInfo['node_version_major'] + '.' + rawDeviceInfo['node_version_minor'] + '.' + rawDeviceInfo['node_version_revision'],
            arch: 'esp8266',
            model: 'esp8266',
            chipID: parseInt(rawDeviceInfo['chip_id']).toString(16),
            flashID: parseInt(rawDeviceInfo['flash_id']).toString(16),
            flashsize: rawDeviceInfo['flash_size'] + 'kB',
            flashmode: rawDeviceInfo['flash_mode'],
            flashspeed: parseInt(rawDeviceInfo['flash_speed']) / 1000000 + 'MHz',
            modules: rawDeviceInfo['modules'],
            lfssize: rawDeviceInfo['lfs_size'] + 'kB',
            git: rawDeviceInfo['git_branch'] + '#' + rawDeviceInfo['git_commit_id'].substr(0,7)
        };
    }

    // maybe an esp32 module with missing node.info() or new esp32 FW with node.info()
    try{
        // chip model as a string "esp32..", e.g. "esp32c3"
        ({response} = await _virtualTerminal.executeCommand(_luaCommandBuilder.command.model));
        const model = response.match(/^esp32.?.?/);

        if (model || chipid){
            return {
                version: rawDeviceInfo['node_version_major'] ? rawDeviceInfo['node_version_major'] + '.' + rawDeviceInfo['node_version_minor'] + '.' + rawDeviceInfo['node_version_revision'] : 'unknown',
                arch: 'esp32',
                model: model ?? 'esp32xx',
                chipID: chipid ? chipid[1] : '_unknown',
                flashID: rawDeviceInfo['flash_id'] ? parseInt(rawDeviceInfo['flash_id']).toString(16) : '_unknown',
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

module.exports = fetchDeviceInfo;
