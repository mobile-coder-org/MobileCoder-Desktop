/**
 * @author Alex Hammer & Daye Jack
 * @date November 20, 2020
 * Latest update: December 7, 2020
 * 
 * Functions to interact with our firestore storage.
 */

// Firebase App (the core Firebase SDK) is always required and
// must be listed before other Firebase SDKs
let {firebase} = require('../environment/config.js');
//import necessary utilities
require("firebase/auth");
require("firebase/firestore");

const chalk = require("chalk");     //Colored outputs

let {User, Workspace, File} = require('../models/models.js')    //MobileCoder Data Models
let db = firebase.firestore();                                  //Firestore storage

class UserService {
    constructor(){
    }

    /**
     * Creates a new user with specified uid, name and email, and returns it.
     * @param {string} uid 
     * @param {string} name
     * @param {string} email 
     * 
     * @return {User || null}
     */
    static async createUser(uid, name, email){
        let user = await db.collection("users").doc(uid).set({
            uid: uid,
            name: name,
            email: email
        }).catch((err) => {
            return null;
        })
        .then(() => {
            let newUser = new User(uid, name, email);
            return newUser;
        });
        return user;
    }

    /**
     * Gets the user specified by the uid, and returns all of it's workspaces and files as well. 
     * No contents specifies whether or not the contents of a file should be collected,
     *  we don't get a file's contents until specified because the contents could be very big, so we try to eliminate stress this way.
     * We have this function return a user with all workspaces and files (minus file contents), because we assume it's memory is much less than that of file contents,
     *  and we try to limit the amount of reads to firestore as much as possible.
     * @param {string} uid 
     * @param {boolean} nocontents 
     * 
     * @return {User || null}
     */
    static async getUser(uid, nocontents){
        let user = await db.collection("users").doc(uid).get().catch((err) => {
            console.log(chalk.red("An error occured when retrieving user..."));
            console.log(chalk.red(err));
        }).then(async (doc) =>{
            if(doc.exists){
                let data = doc.data();
                let workspaces = await UserService.getUserWorkspaces(uid, nocontents);
                let userInfo = new User(uid, data.name, data.email, workspaces);
                return userInfo;
            }
            else {
                console.log(chalk.yellow("User does not exist."));
                return null;
            }
        })
        return user;
    }

    /**
     * Creates a new workspace for the user specified by paramters, and returns it.
     * @param {string} uid 
     * @param {string} workspaceName 
     * @param {int} creation_date - Date.now()
     * 
     * @return {Workspace || null}
     */
    static async createUserWorkspace(uid, workspaceName, creation_date){
        let workspace = await db.collection("users").doc(uid).collection("workspaces").add({
            name: workspaceName,
            creation_date: creation_date,
        }).catch((err) => {
            console.log(chalk.red(err));
            return null;
        })
        .then(docRef => {
            let newWorkspace = new Workspace(docRef.id, workspaceName, creation_date);
            return newWorkspace;
        });
        return workspace;
    }

    /**
     * Get a user's workspaces, and files within. Returns an array of all workspaces within that user's collection.
     * @param {String} uid 
     * @param {Boolean} nocontents - Reasoning is listed above (in getUser())
     * 
     * @return {Workspace[] || null}
     */
    static async getUserWorkspaces(uid, nocontents){
        let workspaces = await db.collection("users").doc(uid).collection("workspaces").get().catch((err) => {
            console.log(chalk.red("An error occurred when retrieving workspaces... "));
            console.log(chalk.red(err));
            return null;
         }).then(async (querySnapshot) =>{
            let workspacesInfo = []; 
            for(let doc of querySnapshot.docs){
                let data = doc.data();
                let files = await UserService.getUserWorkspaceFiles(uid, doc.id, nocontents);
                let workspace = new Workspace(doc.id, data.name, data.creation_date, files);
                workspacesInfo.push(workspace);
            }
            return workspacesInfo; 
        });
        return workspaces;
    }


    /**
     * Deletes a specified workspace from User's collection. 
     * We have to take in an array of file ID's as well, because deleting a collection on firebase does not delete it's subdocuments, so we have to manually do it.
     * Returns true/false based on whether or not all files and the workspace was deleted. If a single file deletion fails, the execution stops and returns false.
     * @param {String} uid 
     * @param {String} wid 
     * @param {String[]} fids 
     * 
     * @return {boolean}
     */
    static async deleteUserWorkspace(uid, wid, fids){
        let cont = true;
        if(fids){
            for(let fid of fids){
                if(await UserService.deleteUserWorkspaceFile(uid, wid, fid))
                    console.log(chalk.green("Deleted file with fid: " + fid));
                else{
                    console.log(chalk.red("Failed to delete file with fid: " + fid + " exiting delete execution..."));
                    cont = false;
                }
            }
        }
        if(cont){
            let r = await db.collection("users").doc(uid).collection("workspaces").doc(wid).delete().catch((err) => {
                console.log(chalk.red(err));
                return false;
            }).then(() => {
                return true;
            });
            return r;
        } else 
            return false;
    }

    /**
     * Creates a file in specified workspace in user's collection. Returns that file on success, null on failure.
     * Paramters are based on MobileCoder data models.
     * @param {String} uid 
     * @param {String} wid 
     * @param {String} fileName 
     * @param {String} extension 
     * @param {String} contents 
     * @param {String} desktop_abs_path 
     * 
     * @return {File || null}
     */
    static async createUserWorkspaceFile(uid, wid, fileName, extension, contents, desktop_abs_path){
        let file = await db.collection("users").doc(uid).collection("workspaces").doc(wid).collection("files").add({
            name: fileName,
            extension: extension,
            contents: contents,
            desktop_abs_path: desktop_abs_path
        }).catch((err) => {
            console.log(chalk.red(err));
            return null;
        }).then(docRef => {
            let fileNoContents = new File(docRef.id, fileName, extension, "", desktop_abs_path);
            return fileNoContents;
        });
        return file;
    }

    /**
     * Gets a users workspace files, generally without contents (specified by nocontents) - and returns an array of files.
     * @param {String} uid 
     * @param {String} wid 
     * @param {Boolean} nocontents 
     * 
     * @return {File[] || null}
     */
    static async getUserWorkspaceFiles(uid, wid, nocontents){
        let files = await db.collection("users").doc(uid).collection("workspaces").doc(wid).collection("files").get().catch((err) => {
            console.log(chalk.red("An error occurred when retrieving current workspace files..."))
            console.log(err);
            return null;
        }).then(async (querySnapshot) => {
            let filesInfo = [];
            for(let doc of querySnapshot.docs){
                let data = doc.data();
                let contents = nocontents ? "" : data.contents;
                let file = new File(doc.id, data.name, data.extension, contents, data.desktop_abs_path);
                filesInfo.push(file);
            }
            return filesInfo;
        });
        return files;
    }

    /**
     * Gets a specific file's contents, specified by the file ID given. Returns a string of only the contents.
     * @param {String} uid 
     * @param {String} wid 
     * @param {String} fid 
     * 
     * @return {String || null}
     */
    static async getUserWorkspaceFileContent(uid, wid, fid){
        let fileContent = db.collection("users").doc(uid).collection("workspaces").doc(wid).collection("files").doc(fid).get().catch((err) => {
            console.log(chalk.red("An error occured when retrieving contents of file..."));
            console.log(chalk.red(err));
            return null;
        }).then((doc) =>{
            let data = doc.data()
            return data.contents;
        });
        return fileContent;
    }

    /**
     * Deletes a file in specified workspace, based on passed file ID. Returns true on success or false on failure.
     * @param {String} uid 
     * @param {String} wid 
     * @param {String} fid 
     * 
     * @return {Boolean}
     */
    static async deleteUserWorkspaceFile(uid, wid, fid){
        let r = await db.collection("users").doc(uid).collection("workspaces").doc(wid).collection("files").doc(fid).delete().catch((err) =>{
            console.log(chalk.red(err));
            return false;
        }).then(() => {
            return true;
        });
        return r;
    }

    /**
     * Overwrites an existing file in user's workspace by deleting it, and creating a new one. 
     * This currently changes the file ID, and we have to update it manually in prompt, which is why we need to return the newFile created (so we can get the fid).
     * @param {String} uid 
     * @param {String} wid 
     * @param {File} file 
     * 
     * @return {File || null}
     */
    static async overwriteUserWorkspaceFile(uid, wid, file){
        await UserService.deleteUserWorkspaceFile(uid, wid, file.fid);
        let newFile = await UserService.createUserWorkspaceFile(uid, wid, file.name, file.extension, file.contents, file.desktop_abs_path);
        if(newFile)
            return newFile;
        else    
            return null;
    }

}

module.exports = {UserService}