const crypto = require('crypto');

module.exports = {
    hash: (input, encoding) => crypto.createHash('sha256').update(input).digest(encoding || global.app.config.crypto.encoding),
    encrypt: (input, encoding) => {
        encoding = encoding || global.app.config.crypto.encoding;
        const cipher = crypto.createCipheriv('aes-256-cbc', global.app.config.crypto.key, global.app.config.crypto.iv);
        return cipher.update(input, 'utf8', encoding) + cipher.final(encoding);
    },
    decrypt: (input, encoding) => {
        encoding = encoding || global.app.config.crypto.encoding;
        const decipher = crypto.createDecipheriv('aes-256-cbc', global.app.config.crypto.key, global.app.config.crypto.iv);
        return decipher.update(input, encoding, 'utf8') + decipher.final('utf8');
    }
};
