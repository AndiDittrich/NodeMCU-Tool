const _luamin = require('luamin');

// strip comments and whitespaces from lua content
function minifyLuaContent(rawContent){
    // apply minification 
    const t = _luamin.minify((rawContent.toString('utf-8')));

    // re-convert to buffer
    return new Buffer.from(t, 'utf-8');
}

module.exports = {
    minify: minifyLuaContent
};
