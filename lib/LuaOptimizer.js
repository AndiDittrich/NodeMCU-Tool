
// strip comments and whitespaces from lua content
function optimizeLuaContent(rawContent){
    // apply optimizations
    var t = rawContent.toString('utf-8')
        .replace(/--.*$/gim, '')
        .replace(/(\r\n|\n\r|\n|\r)+/g, '$1')
        .replace(/^\s+/gm, '')
        .trim();

    // re-convert to buffer
    return new Buffer(t, 'utf-8');
};

module.exports = {
    optimize: optimizeLuaContent
};