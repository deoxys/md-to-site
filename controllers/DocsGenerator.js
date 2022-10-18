/**
 * @file
 * It contains the functions to build the static website from
 * a folder containing the markdown files.
 */

import Utils from "../libs/Utils.js";
import { MdLoader, Tree } from "../libs/MdLoader.js";
import HtmlRender from "../libs/HtmlRender.js";

/**
 * Holds the keywords for building the searching index.
 * @type {Array}
 */
var searchIndex = [];

var VERBOSE_LEVEL = 0;

function WARN() {
    VERBOSE_LEVEL >= 0 && console.log.apply(console, arguments);
}
function INFO() {
    VERBOSE_LEVEL >= 1 && console.log.apply(console, arguments);
}
function DEBUG() {
    VERBOSE_LEVEL >= 2 && console.log.apply(console, arguments);
}

/**
 * Compile the markdown files to HTML.
 *
 * @param {Object} argv     list of arguments coming from process.argv
 * @returns {void}
 */
function build(argv) {
    try {
        var params = validateArguments(argv);
        VERBOSE_LEVEL = argv.verbose;
    } catch (e) {
        Utils.logErrorToConsole(e);
        return;
    }

    const mdLoader = new MdLoader();
    const htmlRender = new HtmlRender();
    const tree = new Tree(params.source);

    // loading the markdown files information from the source directory
    DEBUG(params);
    mdLoader
        .getMdFiles(
            params.source,
            null,
            0,
            params.exclude,
            params.include,
            tree.getRoot(),
            tree
        )
        .then((arr) => {
            
            arr = tree.getNodes().filter(e => e.leaf).map((e) => e.data);
            
            DEBUG(arr.map((e) => e.path));
            if (!arr.length) {
                throw `The source folder "${params.source}" has no markdown files.`;
            }
            
            // add to the array of markdown file the HTML translation, page title and html filename
            var docs = htmlRender.appendHtmlInfoToMdDocs(arr, params.indexFile);
            
            // sort the array by parent dir name and full title
            // docs = Utils.sortFiles(docs);
            // console.log(docs.map(e => e.path));
            
            // creating the target directory if it does not exist
            Utils.createDirIfNotExists(params.target);
            
            // copy the assets (CSS files) to the target directory
            htmlRender.copyAssetsToDestinationDir(params.target);
            
            // looping the DOCS
            for (var doc of docs) {
                // if the search is hidden then it exludes building the search index
                if (!params.hide || !params.hide.includes("search"))
                appendToSearchIndex(doc);
                
                // getting the HTML of the page
                const t = tree.root;
                var html = htmlRender.getHtmlPage(docs, doc, "default", tree.root, {
                    title: params.siteTitle,
                    hide: params.hide,
                });

                // writing the HTML page content to the target file
                Utils.writeFileSync(params.target + doc.htmlFileName, html);

                // if the current doc in the loop is signed as index then the HTML
                // content will be placed in the index as well
                if (doc.isIndex) {
                    Utils.writeFileSync(params.target + "index.html", html);
                }

                INFO('The file "' + doc.file + '" has been compiled.');
            }

            createIndexSearchFile(params.target);

            WARN("The docs have been compiled successfully!)");
            WARN("They can be found here: " + params.target);
        })
        .catch((e) => Utils.logErrorToConsole(e));
}

/**
 * Creates the JS file that index the data for the search.
 *
 * @param {Object} params     directory where to store the file
 * @returns void
 */
function createIndexSearchFile(target) {
    var js = `\nvar searchIndex = [];\n`;

    for (var i = 0; i < searchIndex.length; i++) {
        var file = searchIndex[i].file.replace(/'/g, "\\'"); // escaping the single quote
        var title = searchIndex[i].title.replace(/'/g, "\\'"); // escaping the single quote
        js += `searchIndex[${i}]={f:'${file}',t:'${title}',c:[`;

        var strSearches = "";
        if (searchIndex[i].searches.length) {
            for (var search of searchIndex[i].searches) {
                strSearches += `'` + search.replace(/'/g, "\\'") + `',`;
            }
        }
        js += strSearches + `]};\n`;
    }

    Utils.writeFileSync(target + "js/searchIndex.js", js);
}

/**
 * Append to the searchIndex variable the elements to index for the search
 * related to the given doc.
 *
 * @param {Object} doc     the document to index for the search
 * @returns void
 */
function appendToSearchIndex(doc) {
    if (doc && doc.searchIndex && doc.searchIndex.length) {
        var searches = [];

        for (var text of doc.searchIndex) {
            if (text) searches.push(text);
        }

        searchIndex.push({
            file: doc.htmlFileName,
            title: doc.title || "",
            searches,
        });
    }
}

/**
 * Validate the data coming from the command.
 *
 * @param {Object} argv     list of arguments coming from process.argv
 * @returns {Object}        data validated
 */
function validateArguments(argv) {
    if (argv.hide) {
        argv.hide = argv.hide.split(",");

        for (var hideElem of argv.hide) {
            if (!Utils.getHideItems().includes(hideElem)) {
                throw (
                    `The argument "${hideElem}" of the parameter --hide is not valid. The values allowed are: ` +
                    Utils.getHideItems().join(",")
                );
            }
        }
    }

    argv.source = Utils.sanitizePath(argv.source);
    argv.target = Utils.sanitizePath(argv.target);
    return argv;
}

export { build };
