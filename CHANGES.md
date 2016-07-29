### 2.0.0-BETA1 ###
* Added: `reset` command to Hard-Reset the NodeMCU module using DTR/RTS reset circuit (like NodeMCU DEV Kit)
* Added: RAW output format to `fsinfo` command - feature requested [on GitHub](https://github.com/AndiDittrich/NodeMCU-Tool/issues/13) #13
* Added: `--connection-delay` option to fix broken reset circuits which cause a immediate hard-reset on opening the serial connection (dts/rts lines) #14 
* Changed: footprints of NodeMCU-Tool.js functions - port/baudrate are set globally by setOptions instead by each function
* Changed: [logging-facility](https://github.com/AndiDittrich/Node.Logging-Facility) is used for global log output management
* Changed: Updated the [serialport package](https://github.com/EmergingTechnologyAdvisors/node-serialport) to v4.0.0
* Changed: Function footprint of `NodeMCU-Tool.fsinfo` changed to `function(port, baud, format)` - format can be json, raw or null
* Bugfix: Silent mode was not completely silent - thanks to [remcoder on GitHub](https://github.com/remcoder) #12
* Deprecated: `NodeMcuConnector.onError` callback will be removed in the future (replaced by logging-facility)
* Deprecated: `ScriptableSerialTerminal.onError` callback will be removed in the future (replaced by logging-facility)

### 1.6.0 ###
* Added: `--run` option to the terminal command to execute a file on the nodemcu when opening a new terminal session - feature requested by [blezek on GitHub](https://github.com/AndiDittrich/NodeMCU-Tool/issues/11)
* Added: [gulp](http://gulpjs.com/) based build example - thanks to [remcoder](https://github.com/AndiDittrich/NodeMCU-Tool/commits/master?author=remcoder)

### 1.5.0 ###
* Added: Bulk/Multi File upload
* Added: `devices` command to display a list of all connected NodeMCU Devices
* Added: `noninteractive` options to the `mkfs` command to disable user interaction (confirm dialog)
* Added: Global `--silent` mode to disable log/status messages - only errors and direct outputs are displayed
* Added: Apache [ANT](http://ant.apache.org/) build script example (programmatic file upload)
* Added: PHP Usage example (programmatic usage of fsinfo command)
* Added: Python Usage example (programmatic usage of devices command)
* Added: Programmatic Usage [Guide](docs/ProgrammaticUsage.md)
* Added: Step-by-Step Getting-Start Guide to the Documentation
* Added: Output handler to the middleware (separate log, error, output handler are available)
* Changed: Cleaned up `NodeMCU-Tool.js` - a connection is now established within a helper function
* Changed: The `Connector.upload` function will not remove a existing file anymore - it's now handled by the middleware (eliminates code redundancy)
* Changed: The device-list is not shown anymore in case there is an error during the connection establishment - please use the `devices` command
* Changed: On error, the process will now exit with return-code **1**
* Improved: Hex-Upload-Helper is only uploaded one-times during a connector session (speedup when uploading multiple files)
* Bugfix: Upload Errors were not forwarded to the frontend 
* Bugfix: The `--compile` options doesn't check the file-type

### 1.4.0 ###
* Added: Ability to provide remote destination filename or keep relative path in destination filename - thanks to [loicortola on GitHub](https://github.com/AndiDittrich/NodeMCU-Tool/pull/5)
* Added: Shortcut to the executable file to the root dir 
* Changed: `fsinfo` will return the total number of files as well as a `No Files found` message - feature requested [on GitHub](https://github.com/AndiDittrich/NodeMCU-Tool/issues/3)
* Changed: related to the destination filename option, the arguments of the `upload` function has changed - third party applications require an update!

### 1.3.2 ###
* Bugfix: `fsinfo` operation will fail in case there are no files on the esp module - thanks to [soldair on GitHub](https://github.com/AndiDittrich/NodeMCU-Tool/pull/1)

### 1.3.1 ###
* Bugfix: Tool throws a fatal error in case `.nodemcutool` file is not available

### 1.3.0 ###
* Added: Project based configurations to set default options like port, baudrate within `.nodemcutool` file
* Bugfix: Debugging output using `--optimize` flag was displayed

### 1.2.0 ###
* Added: Binary file transfer
* Added: Download function to fetch file from NodeMCU (binary save)
* Added: Additional check to verify the existence of a remote file for read/write operations 
* Changed: File-Content is hex-encoded before upload - this allows binary file uploads and "unlimited" line size (not longer limited to 235chars per line!)
* Changed: All used LUA commands/functions are centralized in NodeMcuConnector
* Changed: the `--optimize` flag only works for LUA files with file-type `.lua`

### 1.1.0 ###
* Added: NodeMCU-Tool.js to use the connector as well as all CLI functions programmatically
* Added: Colorized terminal messages
* Added: Low Level API for direct interactions with the LUA interpreter
* Changed: The bin tool has been separated in two files (CLI and API layer)
* Changed: all errors are handled as callbacks (Node.js standard)
* Changed: moved the `test.lua` file to top-level and renamed it to `helloworld.lua`
* Changed: Whitespaces of the beginning of each line are removed when using the `optimize` flag
* Bugfix: Replaced the progress bar with [cli-progress](https://www.npmjs.com/package/cli-progress) to avoid random empty lines on the terminal
* Bugfix: Aborting the confirm dialog of the `mkfs` command with <kbd>ctrl+c</kbd> raised an error

### 1.0.0 ###
Initial public release