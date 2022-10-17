#!/usr/bin/env node
import { build } from "./controllers/DocsGenerator.js";

import yargs from "yargs";
import { hideBin } from "yargs/helpers";

const argv = yargs(hideBin(process.argv))
    .usage("Usage: $0 <command> [options]")
    .command(
        "build <source> <target>",
        "Builds the website from the markdown code.",
        (yargs) => {
            yargs
                .positional("source", {
                    describe:
                        "Directory of the source folder containing the markdown files.",
                    type: "string",
                })
                .positional("target", {
                    describe:
                        "Directory where the compiled HTML are going to be stored.",
                    type: "string",
                })
                .option("include", {
                    alias: "i",
                    describe:
                        "Include only the paths that match the given regex string.",
                    type: "string",
                })
                .option("exclude", {
                    alias: "e",
                    describe:
                        "Exclude the paths that match the given regex string.",
                    type: "string",
                })
                .option("index", {
                    alias: "n",
                    describe:
                        "File name that will be set as index.html. By default is README.md; if there is no README.md then it will be the first occurrence.",
                    type: "string",
                })
                .option("site-title", {
                    alias: "t",
                    describe:
                        "Title of the website: it will appear on the title tag and on top of the menu.",
                    type: "string",
                })
                .option("hide", {
                    describe:
                        "Hide the functionalities or part of the website. Insert the list of items to hide comma separated. Possible values: search, toc.",
                    type: "string",
                })
                .option("verbose", {
                    alias: "v",
                    describe: "Verbose mode.",
                    type: "boolean",
                    });
        },
        (argv) => {
            build(argv);
        }
    )
    .demandCommand(1)
    .count("verbose")
    .alias("v", "verbose")
    .parse();

