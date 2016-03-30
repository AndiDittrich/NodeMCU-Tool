Examples + Common Used Features
===============================

Use the Run Command and Capture the output
------------------------------------------

Normally, the `run` command will surround the lua script output with some status data. 
This feature might be disruptive when you need the output in a third party script - of course you could use a Regular-Expression to match the boundaries, but there is a better option:
It is recommended to use the `--silent` flag to reject status messages - only the script output is returned by NodeMCU-Tool. But keep in mind to check the return_code!

```bash
$ nodemcu-tool run helloworld.lua --silent
Hello World!
|---|
| H |
| E |
| L |
| L |
| O |
| | |
| W |
| O |
| R |
| L |
| D |
|---|
YEAH!!! HELLO WORLD!!!
String: Lorem ipsum dolor sit amet, consetetur sadipscing elitr
```