#!/usr/bin/env node
/*eslint no-process-exit: 0*/

// Manages User CLI interactions

// load utils
const _pkg = require('../package.json');
const { Command } = require('commander');
const _cli = new Command();
const _progressbar = require('cli-progress');
const _colors = require('colors');
const _prompt = require('../lib/cli/prompt');
const _nodemcutool = require('../lib/cli/nodemcu-tool');
const _luaCommandBuilder = require('../lib/lua/command-builder');
const _optionsManager = require('../lib/cli/options-manager');
const _loggingFacility = require('logging-facility');
const _globExpression = require('../lib/cli/glob-expression');
const _logger = _loggingFacility.getLogger('NodeMCU-Tool');
_loggingFacility.addBackend('fancy-cli');

// general content passhrough to stdin
_nodemcutool.onOutput(function(message){
    process.stdout.write(message);
});

// wrap async tasks
function asyncWrapper(promise){
    return function(...args){
        // extract options (last argument)
        _optionsManager.parse(args.pop(), _cli.opts())

            // trigger command
            .then(options => {
                // re-merge
                return promise(...args, options)
            })

            // trigger disconnect
            .then(() => {
                if (_nodemcutool.Connector.isConnected()){
                    _logger.log('disconnecting');
                    return _nodemcutool.disconnect();
                }
            })

            // gracefull exit
            
            .then(() => {
                process.exit(0)
            })

            // handle low-level errors
            .catch(err => {
                _logger.error(err.message);
                _logger.debug(err.stack);
                process.exit(1);
            });
    }
}

// low level com errors
_nodemcutool.onError(err => {
    _logger.error(err.message);
    _logger.debug(err.stack);
    process.exit(127);
});

// CLI setup
_cli
    // read file version package.json
    .version(_pkg.version)

    // serial port device
    .option('-p, --port <port>', 'Serial port device name e.g. /dev/ttyUSB0, COM1', null)

    // serial port baudrate
    .option('-b, --baud <baudrate>', 'Serial Port Baudrate in bps, default 115200', null)

    // silent mode - no status messages are shown
    .option('--silent', 'Enable silent mode - no status messages are shown', null)

    // connection delay between opening the serial device and starting the communication
    .option('--connection-delay <delay>', 'Connection delay between opening the serial device and starting the communication', null)

    // debug mode - display detailed error messages
    .option('--debug', 'Enable debug mode - all status messages + stacktraces are shown', null)

    // io-debug mode
    .option('--io-debug', 'Enable io-debug mode - logs all serial rx/tx messages (requires enabled debug mode)', null);

_cli
    .command('fsinfo')
    .description('Show file system info (current files, memory usage)')

    // json output mode
    .option('--json', 'Display output JSON encoded', null)

    // raw output mode
    .option('--raw', 'Display output as simple text with tab delimiter', null)

    .action(asyncWrapper(async (options) => {
        // output format
        let format = 'human';

        // json format ?
        if (options.json){
            format = 'json';
        }

        // raw format (text)
        if (options.raw){
            format = 'raw';
        }

        await _nodemcutool.fsinfo(format);
    }));

_cli
    .command('run <file>')
    .description('Executes an existing .lua or .lc file on NodeMCU')
    .action(asyncWrapper(async (filename) => {
        await _nodemcutool.run(filename);
    }));

_cli
    .command('upload [files...]')
    .description('Upload Files to NodeMCU target')

    // file minification
    .option('-m, --minify', 'Minifies the file before uploading', null)

    // compile files after upload
    .option('-c, --compile', 'Compile Lua file to bytecode (.lc) and remove the original file after upload', null)

    // keep-path
    .option('-k, --keeppath', 'Keep a relative file path in the destination filename (i.e: static/test.html will be named static/test.html)', null)

    // sets the remote filename
    .option('-n, --remotename <remotename>', 'Set destination file name. Default is same as original. Only available when uploading a single file!', null)

    // run file after upload
    .option('--run', 'Running a file on NodeMCU after uploading. Only available when uploading a single file!', null)

    .action(asyncWrapper(async (filelist, options) => {
        // initialize a new progress bar
        const bar = new _progressbar.Bar({
            clearOnComplete: true,
            hideCursor: true
        }, _progressbar.Presets.shades_classic);

        // expand glob expressions
        const files = await _globExpression.expand(filelist);

        // files provided ?
        if (files.length == 0){
            _logger.error('No files provided for upload (empty file-list)');
            return;
        }

        // handle multiple uploads
        let currentFileNumber = 0;

        await _nodemcutool.upload(files, options, function(current, total, fileNumber){

            // new file ?
            if (currentFileNumber != fileNumber){
                bar.stop();
                currentFileNumber = fileNumber;
                bar.start(total, 1);
            }else{

                bar.update(current);

                // finished ?
                if (current >= total) {
                    bar.stop();
                }
            }
        });
    }));

_cli
    .command('download <file>')
    .description('Download files from NodeMCU target')

    .action(asyncWrapper(async (remoteFilename) => {
        await _nodemcutool.download(remoteFilename);
    }));

_cli
    .command('remove <file>')
    .description('Removes a file from NodeMCU filesystem')
    .action(asyncWrapper(async (filename) => {
        await _nodemcutool.remove(filename);
    }));

_cli
    .command('mkfs')
    .description('Format the SPIFFS filesystem - ALL FILES ARE REMOVED')

    // force fs creation without prompt
    .option('--noninteractive', 'Execute command without user interaction', null)

    .action(asyncWrapper(async (options) => {
        // no prompt!
        if (options.noninteractive){
            // format
            await _nodemcutool.mkfs();
            return;
        }

        // open user prompt
        const result = await _prompt({
            properties: {
                confirm: {
                    pattern: /^(yes|no|y|n)$/gi,
                    description: _colors.cyan('[NodeMCU-Tool]') + '~ Do you really want to format the filesystem and delete all file ?',
                    message: 'Type yes/no',
                    required: true,
                    default: 'no'
                }
            }
        });
        
        // transform to lower case
        const c = result.confirm.toLowerCase();

        // check
        if (c!='y' && c!='yes'){
            _logger.error('Formatting aborted');
            return;
        }

        // format
        await _nodemcutool.mkfs();
    }));


_cli
    .command('terminal')
    .description('Opens a Terminal connection to NodeMCU')
    .option('--run <filename>', 'Running a file on NodeMCU before starting the terminal session', null)
    .action(asyncWrapper(async (options) => {

        // run a initial command on startup ?
        let initialCommand = null;
        if (options.run){
            initialCommand = _luaCommandBuilder.prepare('run', [options.run]);
        }

        // start terminal session
        await _nodemcutool.terminal(initialCommand);
    }));

_cli
    .command('init')
    .description('Initialize a project-based Configuration (file) within current directory')
    .action(asyncWrapper(async () => {
        _logger.log('Creating project based configuration file..');

        // get user input
        const data = await _prompt({
            properties: {
                baudrate: {
                    pattern: /^\d+$/,
                    description: _colors.cyan('[NodeMCU-Tool]') + '~ Baudrate in Bit per Seconds, e.g. 115200 (default)',
                    required: false,
                    message: 'Only Integers allowed!',
                    default: 115200
                },
                port: {
                    pattern: /^.+$/,
                    description: _colors.cyan('[NodeMCU-Tool]') + '~ Serial connection to use, e.g. COM1 or /dev/ttyUSB2',
                    required: false,
                    default: '/dev/ttyUSB0'
                }
            }
        });

        // set defaults
        data.minify = false;
        data.compile = false;
        data.keeppath = false;

        // write config to file
        await _optionsManager.store(data);
    }));

_cli
    .command('devices')
    .description('Shows a list of all available NodeMCU Modules/Serial Devices')

    // disable the device filter based on vendorId's of common NodeMCU modules
    .option('--all', 'Show all Serial Devices, not only NodeMCU Modules', null)

    // json output mode
    .option('--json', 'Display output JSON encoded', null)

    .action(asyncWrapper(async (options) => {
        await _nodemcutool.devices(options.all, options.json);
    }));

_cli
    .command('reset')
    .description('Execute a Hard-Reset of the Module using DTR/RTS reset circuit')

    // softreset mode
    .option('--softreset', 'Resets the module using node.restart() command', null)

    .action(asyncWrapper(async (options) => {
        // software reset
        if (options.softreset){
            await _nodemcutool.softreset();

        // hard-reset nRST
        }else{
            await _nodemcutool.hardreset();
        }

    }));

// run the commander dispatcher
_cli.parse(process.argv);

// default action (no command provided)
if (!process.argv.slice(2).length) {
    _cli.outputHelp();
}
