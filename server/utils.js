function normalizeString(str) {
    return str
        .toLowerCase()     
        .trim()             
        .replace(/\s+/g, "");
}

module.exports = { normalizeString };
