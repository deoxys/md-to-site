import fs from "fs";

/**
 * @class Markdown file loader: get all the information of the markdown
 * files contained in the source folder (if the source is not provided will
 * be the folder where the command has been executed).
 */
export class MdLoader {
    /**
     * Read the content of the given file.
     *
     * @param  {String} filePath    path of the file to read
     * @return {String}             content of the file
     */
    getFileContent(filePath) {
        return fs.readFileSync(filePath, "utf8");
    }

    /**
     * Read the markdown file contents and give back an array of object with
     * all the information of the related markdown file.
     *
     * @param  {String} dir     directory name to read
     * @return {Promise}
     */
    getMdFiles(
        dir,
        parentDir = null,
        indent = 0,
        excludeRegex = null,
        includeRegex = null,
        parent,
        tree
    ) {
        return new Promise((resolve, reject) => {
            // reading the directory
            fs.readdir(dir, async (err, files) => {
                if (err) return reject(err);
                // looping the files in the directory
                for (var file of files) {
                    var path = parentDir ? `${dir}/${file}` : `${dir}${file}`;
                    // console.log(path)
                    if (fs.lstatSync(path).isDirectory()) {
                        if (excludeRegex && path.match(excludeRegex)) {
                            continue;
                        } else if (includeRegex && !path.match(includeRegex)) {
                            continue;
                        } else {
                            // if the path is a directory then it will scan all the file contained in that directory
                            try {
                                var name = file;
                                var current = new Node(
                                    path.replace(tree.getRoot().id, ""),
                                    parent,
                                    new Data(
                                        path,
                                        file,
                                        name,
                                        parentDir,
                                        indent
                                    )
                                );
                                parent.addChild(current);
                                var nodes = await this.getMdFiles(
                                    path,
                                    file,
                                    indent + 1,
                                    excludeRegex,
                                    includeRegex,
                                    current,
                                    tree
                                );
                                current.addChildren(nodes);
                            } catch (e) {
                                return reject(e);
                            }
                        }
                    } else if (
                        file.substring(file.length - 3).toLowerCase() == ".md"
                    ) {
                        // scanning the markdown file
                        var name = file.substring(0, file.length - 3); // removing the .md extention
                        var newNode = new Node(
                            path.replace(tree.getRoot().id, ""),
                            parent,
                            new Data(
                                path,
                                file,
                                name,
                                parentDir,
                                indent,
                                this.getFileContent(path),
                                true
                            ),
                            true
                        );
                        parent.addChild(newNode);
                    }
                }

                // console.log(node);
                tree.sortNodes();
                resolve([]);
            });
        });
    }
}

export class Tree {
    constructor(root) {
        this.nodes = [];
        this.root = new Node(root, null, {}, false, true);
        this.modified = false;
    }

    getRoot() {
        return this.root;
    }

    removeNode(node) {
        this.modified = true;
        this.nodes = this.nodes.filter((n) => n.id !== node.id);
    }

    getNodes(node = null) {
        if (this.modified) {
            this.modified = false;
            this.nodes = this.getNodes(this.root);
        } else if (node) {
            node.id != this.root.id ? this.nodes.push(node) : null;
            for (var child of node.children) {
                this.nodes.concat(this.getNodes(child));
            }
            return this.nodes;
        }
        return this.getNodes(this.root);
    }

    sortNodes() {
        this.modified = true;
        this.root.sortChildren();
    }
}

export class Node {
    constructor(id, parent = null, data, leaf = false, root = false) {
        this.id = id.toLowerCase();
        this.parent = parent;
        this.data = data;
        this.children = [];
        this.leaf = leaf;
        this.root = root;
    }

    getChildren() {
        return this.children;
    }

    addChild(child) {
        if (child.leaf) {
            this.setLeaf(true)
        }
        this.children.push(child);
    }

    addChildren(children) {
        for (var child of children) {
            if (child.leaf) {
                this.setLeaf(true)
            }
            this.addChild(child);
        }
        this.children = this.children.concat(children);
    }

    sortChildren() {
        this.children.sort((a, b) => {
            if (a.data.isMD && !b.data.isMD) return -1;
            if (b.data.isMD && !a.data.isMD) return 1;
            if (b.data.isMD && a.data.isMD)
                return a.id == b.id ? 0 : a.id < b.id ? -1 : 0;
            return a.id == b.id ? 0 : a.id < b.id ? -1 : 1;
        });
        for (var child of this.children) {
            child.sortChildren();
        }
    }

    compareTo(other) {
        if (this.data.isMD && !other.data.isMD) return -1;
        if (other.data.isMD && !this.data.isMD) return 1;
        if (other.data.isMD && this.data.isMD)
            return this.id == other.id ? 0 : this.id < other.id ? -1 : 0;
        return this.id == other.id ? 0 : this.id < other.id ? -1 : 1;
    }

    removeChild(child) {
        this.children = this.children.filter((c) => c.id != child.id);
    }

    setLeaf(value) {
        this.leaf = value || this.leaf;
        if (this.parent) {
            this.parent.setLeaf(value);
        }
    }

    inspect(depth, opts) {
        if (this.parent) {
            return (
                "{ Node: " +
                this.id +
                ", leaf: " +
                this.leaf +
                ", parent: " +
                this.parent.id +
                ", children " +
                this.children.length +
                " }"
            );
        } else {
            return "{ Node: " + this.id + " }";
        }
    }
}

class Data {
    constructor(path, file, name, parentDir, indent, md = "", isMD = false) {
        this.path = path;
        this.file = file;
        this.name = name;
        this.md = md;
        this.parentDir = parentDir;
        this.indent = indent;
        this.isMD = isMD;
        this.pathPieces = path.split("/");
    }
}
