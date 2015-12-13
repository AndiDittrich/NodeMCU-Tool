### 1.1.0 ###
Added: NodeMCU-Tool.js to use the connector as well as all CLI functions programmatically
Added: Colorized terminal messages
Added: Low Level API for direct interactions with the LUA interpreter
Changed: The bin tool has been separated in two files (CLI and API layer)
Changed: all errors are handled as callbacks (Node.js standard)
Bugfix: Replaced the progress bar with [cli-progress](https://www.npmjs.com/package/cli-progress) to avoid random empty lines on the terminal

### 1.0.0 ###
Initial public release