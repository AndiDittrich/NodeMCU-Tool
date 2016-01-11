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