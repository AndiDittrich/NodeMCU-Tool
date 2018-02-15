// lua command templates - central location for easier debugging
const lua_commands = {
    // connection info echo command,
    echo: 'print("echo1337")',

    // info command (flash id)
    nodeInfo: 'print(node.info());',

    // chipid info
    chipid: 'print(node.chipid());',

    // file system info
    fsInfo: 'print(file.fsinfo())',

    // format the file system
    fsFormat: 'file.format()',

    // compile a remote file
    compile: 'node.compile("?")',

    // run a file
    run: 'dofile("?")',

    // soft-reset
    reset: 'node.restart()',

    // list files on SPIFFS
    listFiles: 'local l = file.list();for k,v in pairs(l) do uart.write(0,k..":"..v..";") end print("")',

    // file open
    fileOpen: 'print(file.open("?", "?"))',

    // close a opened file
    fileClose: 'file.close()',

    // remove file
    fileRemove: 'file.remove("?")',

    // file close & flush
    fileCloseFlush: 'file.flush() file.close()',

    // helper function to write hex/base64 encoded content to file @see docs/TransferEncoding.md
    transferWriteHelper: "if encoder and encoder.fromBase64 then _G.__nmtwrite = function(s) file.write(encoder.fromBase64(s)) end print('b') else _G.__nmtwrite = function(s) for c in s:gmatch('..') do file.write(string.char(tonumber(c, 16))) end end print('h') end",

    // helper function to read hex/base64 encoded content from file  @see docs/TransferEncoding.md
    transferReadHelper: "function __nmtread()local b = encoder and encoder.toBase64 while true do c = file.read(b and 240 or 1) if c==nil then print('')break end uart.write(0, b and encoder.toBase64(c) or string.format('%02X', string.byte(c)))end print('') end"
};

module.exports = lua_commands;

