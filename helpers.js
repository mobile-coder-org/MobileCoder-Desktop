/**
 * @author Alex Hammer
 * @date October 31, 2020
 * Latest Update: November 24, 2020
 * 
 * Helper functions to interact with files and class FileHelper to call the helper functions.
 */

const path = require("path");           //Utility to work with file/directory paths
const fs = require("fs");               //File System module
const rl = require("readline-sync");    //Read user inputs synchronously
const chalk = require("chalk");         //Colored outputs

class FileHelper{
    /**
     * Takes in a filename, opens it and returns contents as a string
     * @param {String} filename 
     * 
     * @return {String || null}
     */
    static openFile(filename){
        try{
            var contents = fs.readFileSync(filename, "utf8");
            return contents;
        } catch(e){
            console.log(chalk.red("Error:", e.stack));
            return null;
        }
    }

    /**
     * Takes in a filename, and returns the extension on it (.js, .txt, .json, etc.)
     * @param {String} filename 
     */
    static getFileExt(filename){
        return path.extname(filename);
    }

    /**
     * Takes in a name, contents, and an extension and creates a file with contents filled with 'conents' with name 'name' and extension 'extension'
     * @param {String} name 
     * @param {String} contents 
     * @param {String} extension 
     */
    static async createFile(name, contents, extension){
        let overwriteFile = true;
        if(fs.existsSync(name+extension))
            overwriteFile = rl.keyInYNStrict(chalk.yellow(name+extension + " already exists, would you like to overwrite?"));
        if(overwriteFile){
            fs.writeFileSync(name + extension, contents);
            if(fs.existsSync(name+extension))
                return true;
            else
                return false;
        } else  
            return false;
    }

    /**
     * Takes 2 file paths and overwrites one file's contents with the others.
     * If original file path (file to be overwritten) doesn't exists, it just creates it and uses the other file's contents.
     * @param {String} origFilePath = file to be overwritten
     * @param {String} newFilePath  = file whose contents will be used to overwrite
     * 
     * @return {Boolean}
     */
    static overwriteFile(origFilePath, newFilePath){
        if(!fs.existsSync(newFilePath)){
            console.log(chalk.red("File to overwrite with does not exist."));
            return false;
        }
        var contents = openFile(newFilePath);
        fs.writeFileSync(origFilePath, contents, function (err){ 
            if(err){
                throw err;
            }
        });
        return true;
    }

    /**
     * Takes a given pathname and gets the absolute path to the file.
     * @param {String} pathname 
     * 
     * @return {String || null} 
     */
    static getAbsolutePath(pathname){
        if(fs.existsSync(pathname))
            return path.resolve(pathname);
        return null;
    }
}

module.exports = {
	FileHelper: FileHelper
}
