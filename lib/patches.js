/**
 * Monkey-patch parsePagesList to set the direction of a page based on the language
 * of the book, instead of using wooorm/direction to determine its direction from its content
 * As is done by gitbook:
 * https://github.com/GitbookIO/gitbook/blob/3.2.2/lib/parse/parsePageFromString.js#L18
 * This will fail to recognize a text as Hebrew if the first line is for example
 * `# {{ page.title }}`
 **/
exports.patchParsePagesList = function patchParsePagesList() {
    const Parse = require('./parse');
    const origParsePagesList = Parse.parsePagesList;

    Parse.parsePagesList = function (book) {
        const language = book.getConfig().getValue('language');
        return origParsePagesList.apply(this, arguments).then((pages) => {
            if (language === 'he') {
                return pages.map((page) => page.set('dir', 'rtl'));
            }
            return pages;
        })
    };
};

/**
 * Monkey-patch ensureFolder to only make sure the directory exist, without emptying it
 * It seems that deleting the _book directory causes EPERM errors under windows when
 * watching for changes
 */
exports.patchEnsureFolder = function patchEnsureFolder() {
    const Mkdirp = require('mkdirp');
    const Fs = require('./utils/fs');
    const origEnsureFolder = Fs.ensureFolder;
    Fs.ensureFolder = (dir) => {
        const promise = new Promise((resolve, reject) => {
            Mkdirp(dir, (err) => {
                err
                    ? reject(err)
                    : resolve();
            });
        });

        promise.thenResolve = function (value) {
            return this.then(function () {
                return value;
            });
        };

        return promise;
    };
};