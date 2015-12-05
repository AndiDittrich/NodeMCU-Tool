#!/usr/bin/env node

// load utils
var _fs = require('fs');
var _cli = require('commander');
var _nodeMcuConnector = require('../lib/NodeMcuConnector');
var _serialTerminal = require('../lib/SerialTerminal');
var _progressbar = require('progress');
var _pkg = require('../package.json')
var _prompt = require('prompt');

// CLI setup
_cli
    // read file version package.json
    .version(_pkg.version)

    // serial port device
    .option('-p, --port <port>', 'Serial port device name e.g. /dev/ttyUSB0, COM1', '/dev/ttyUSB0')

    // serial port baudrate
    .option('-b, --baud <baudrate>', 'Serial Port Baudrate in bps, default 9600', '9600');

_cli
    .command('fsinfo')
    .description('Show file system info (current files, memory usage)')
    .action(function() {
        // create new connector
        var connector = new _nodeMcuConnector(_cli.port, _cli.baud);

        // handle connection errors
        connector.onError(function(error){
            console.error('ERROR ' + error);
        });

        connector.connect(function(){
           connector.fsinfo(function(meta, files){

               console.log('\n[NodeMCU] Free Disk Space: ' + meta.remaining + ' KB | Total: ' + meta.total + ' KB');
               console.log('[NodeMCU] Files stored into Flash (SPIFFS)');

               // print fileinfo
               files.forEach(function(file){
                    console.log(' |- ' + file.name + ' (' + file.size + ' Bytes)');
               });
               console.log('');

               // finished!
               connector.disconnect();
           });
        });
    });

_cli
    .command('run <file>')
    .description('Executes an existing .lua or .lc file on NodeMCU')
    .action(function(filename) {
        // create new connector
        var connector = new _nodeMcuConnector(_cli.port, _cli.baud);

        // handle connection errors
        connector.onError(function(error){
            console.error('ERROR ' + error);
        });

        connector.connect(function(){
            connector.run(filename, function(output){
                // just show complete message (no feedback from nodemcu)
                console.log('[NodeMCU] Running "' + filename + '"');
                console.log(output);

                // finished!
                connector.disconnect();
            });
        });
    });


_cli
    .command('upload <file>')
    .description('Upload LUA files to NodeMCU (ESP8266) target')

    // file cleanup
    .option('-o, --optimize', 'Removes comments and empty lines from file before uploading', false)

    // compile files after upload
    .option('-c, --compile', 'Compile LUA file to bytecode (.lc) and remove the original file after upload', false)

    .action(function(localFile, options){
        // print empty new line
        console.log('');

        // local file available ?
        if (!_fs.existsSync(localFile)){
            console.error('File not found "' + localFile + '"');
            return;
        }

        // create new connector
        var connector = new _nodeMcuConnector(_cli.port, _cli.baud);

        // handle connection errors
        connector.onError(function(error){
           console.error('ERROR ' + error);
        });

        connector.connect(function(){
            // empty line
            console.log('');
            var bar = null;

            connector.upload(localFile, options.optimize,
                // onComplete
                function(){
                    console.log('\n[Data Transfer] COMPLETE');

                    // compile flag set ?
                    if (options.compile){
                        console.log('[NodeMCU] compiling lua file..');

                        connector.compile(localFile, function(error){
                            // success ? empty line will return (null)
                            if (error){
                                console.log('[NodeMCU] Error: ' + error);
                                connector.disconnect();
                            }else{
                                console.log('[NodeMCU] Success');

                                // drop oiginal lua file
                                connector.removeFile(localFile, function(){
                                    console.log('[NodeMCU] Original LUA file removed');
                                    connector.disconnect();
                                });
                            }
                        });

                    }else{
                        // finished!
                        connector.disconnect();
                    }
                },

                // on progress
                function(current, total){
                    // init ?
                    if (current == 0){
                        bar = new _progressbar('[Data Transfer] [:bar] :percent (ETA :etas)', {
                            total: total,
                            width: 40,
                            complete: '=',
                            incomplete: ' ',
                            stream: process.stdout
                        });


                    }else{
                        bar.tick(current);
                    }
                }
            );
        });
    });

_cli
    .command('remove <file>')
    .description('Removes a file from NodeMCU filesystem')
    .action(function(filename) {
        // create new connector
        var connector = new _nodeMcuConnector(_cli.port, _cli.baud);

        // handle connection errors
        connector.onError(function(error){
            console.error('ERROR ' + error);
        });

        connector.connect(function(){
            connector.removeFile(filename, function(){
                // just show complete message (no feedback from nodemcu)
                console.log('\n[NodeMCU] File "' + filename + '" removed!\n');

                // finished!
                connector.disconnect();
            });
        });
    });

_cli
    .command('mkfs')
    .description('Format the SPIFFS filesystem - ALL FILES ARE REMOVED')
    .action(function(){
        // user confirmation required!
        _prompt.start();
        _prompt.message = '';
        _prompt.delimiter = '';
        _prompt.colors = false;

        _prompt.get({
            properties: {
                confirm: {
                    pattern: /^(yes|no|y|n)$/gi,
                    description: 'Do you really want to format the filesystem and delete all file ?',
                    message: 'Type yes/no',
                    required: true,
                    default: 'no'
                }
            }
        }, function (err, result){
            // transform to lower case
            var c = result.confirm.toLowerCase();

            // check
            if (c!='y' && c!='yes'){
                console.log('[NodeMCU-Tool] Formatting aborted');
                return;
            }

            // create new connector
            var connector = new _nodeMcuConnector(_cli.port, _cli.baud);

            // handle connection errors
            connector.onError(function(error){
                console.error('ERROR ' + error);
            });

            connector.connect(function(){
                console.log('\n[NodeMCU] Formatting the file system...this will take around ~30s');

                connector.format(function(response){
                    // just show complete message
                    console.log('\n[NodeMCU] File System created | ' + response + '\n');

                    // finished!
                    connector.disconnect();
                });
            });
        });

    });


_cli
    .command('terminal')
    .description('Opens a Terminal connection to NodeMCU')
    .action(function(){
        // create new connector
        var terminal = new _serialTerminal();

        // handle connection errors
        terminal.onError(function(error){
            console.error('ERROR ' + error);
        });

        terminal.passthrough(_cli.port, _cli.baud);
    });

// run the commander dispatcher
_cli.parse(process.argv);

// default action (no command provided)
if (!process.argv.slice(2).length) {
    _cli.outputHelp();
}