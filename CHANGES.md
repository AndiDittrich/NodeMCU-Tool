### 1.1.0 ###
Added: NodeMCU-Tool.js to use the connector as well as all CLI functions programmatically
Added: Colorized terminal messages
Added: Low Level API for direct interactions with the LUA interpreter
Changed: The bin tool has been separated in two files (CLI and API layer)
Changed: all errors are handled as callbacks (Node.js standard)
Changed: moved the `test.lua` file to top-level and renamed it to `helloworld.lua`
Changed: Whitespaces of the beginning of each line are removed when using the `optimize` flag
Bugfix: Replaced the progress bar with [cli-progress](https://www.npmjs.com/package/cli-progress) to avoid random empty lines on the terminal
Bugfix: Aborting the confirm dialog of the `mkfs` command with <kbd>ctrl+c</kbd> raised an error

### 1.0.0 ###
Initial public release