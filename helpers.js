/**
 * @author Alex Hammer
 * @date October 31, 2020
 * 
 * Helper functions to interact with files and class FileHelper to call the helper functions.
 */

class FileHelper{
    static open(filename){
        return openFile(filename);
    }
    static getExt(filename){
        return getFileExt(filename);
    }
    static create(name, contents, extension){
        return createFile(name, contents, extension);
    }
    static overwrite(origFilePath, newFilePath){
        return overwriteFile(origFilePath, newFilePath);
    }
    static getAbsPath(pathname){
        return getAbsolutePath(pathname);
    }
}

const path = require("path");
const fs = require("fs");

 /**
  * Takes in a filename, opens it and returns contents as a string
  * @param {String} filename 
  * @return {String} contents, null on error
  */
 function openFile(filename){
    try{
        var contents = fs.readFileSync(filename, "utf8");
        return contents;
    } catch(e){
        console.log("Error:", e.stack);
        return null;
    }
 }

/**
 * Takes in a filename, and returns the extension on it (.js, .txt, .json, etc.)
 * @param {String} filename 
 */
 function getFileExt(filename){
    return path.extname(filename);
}

/**
 * Takes in a name, contents, and an extension and creates a file with contents filled with 'conents' with name 'name' and extension 'extension'
 * @param {String} name 
 * @param {String} contents 
 * @param {String} extension 
 */
function createFile(name, contents, extension){
    fs.writeFileSync(name + extension, contents, function (err) {
        if(err) throw err;
    });
}

/**
 * Takes 2 file paths and overwrites one file's contents with the others.
 * If original file path (file to be overwritten) doesn't exists, it just creates it and uses the other file's contents.
 * @param {String} origFilePath = file to be overwritten
 * @param {String} newFilePath  = file whose contents will be used to overwrite
 * @return {Boolean}
 */
function overwriteFile(origFilePath, newFilePath){
    if(!fs.existsSync(newFilePath)){
        console.log("File to overwrite with does not exist.");
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
 * @return {String} absolutePath on success, null on failure
 */
function getAbsolutePath(pathname){
    if(fs.existsSync(pathname))
        return path.resolve(pathname);
    return null;
}