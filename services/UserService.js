// Firebase App (the core Firebase SDK) is always required and
// must be listed before other Firebase SDKs
let {firebase} = require('../environment/config.js');

// Add the Firebase services that you want to use
require("firebase/auth");
require("firebase/firestore");

//get models
let {User, Workspace, File} = require('../models/models.js')

let db = firebase.firestore();

class UserService {
    constructor(){
    }

    static async createUser(uid, name, email){
        let user = await db.collection("users").doc(uid).set({
            uid: uid,
            name: name,
            email: email
        })
        .then(() => {
            let newUser = new User(uid, name, email);
            return newUser;
        });
        return user;
    }

    static async getUser(uid, nocontents){
        let user = await db.collection("users").doc(uid).get().catch((err) => {
            console.log("error getting user");
            console.log(err);
        }).then(async (doc) =>{
            if(doc.exists){
                let data = doc.data();
                let workspaces = await UserService.getUserWorkspaces(uid, nocontents);
                let userInfo = new User(uid, data.name, data.email, workspaces);
                return userInfo;
            }
            else {
                console.log("user does not exist");
                return null;
            }
        })
        return user;
    }

    static async createUserWorkspace(uid, workspaceName, creation_date){
        let workspace = await db.collection("users").doc(uid).collection("workspaces").add({
            name: workspaceName,
            creation_date: creation_date,
        }).catch((err) => {
            console.log("could not create workspace"); 
            console.log(err);
        })
        .then(docRef => {
            let newWorkspace = new Workspace(docRef.id, workspaceName, creation_date);
            console.log("New workspace created with name: ", newWorkspace.name);
            return newWorkspace;
        });
        return workspace;
    }

    static async getUserWorkspaces(uid, nocontents){
        let workspaces = await db.collection("users").doc(uid).collection("workspaces").get().catch((err) => {
            console.log("error getting workspaces")
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

    static async deleteUserWorkspace(uid, wid, fids){
        if(fids){
            for(let fid of fids){
                await UserService.deleteUserWorkspaceFile(uid, wid, fid);
            }
        }
        await db.collection("users").doc(uid).collection("workspaces").doc(wid).delete().catch((err) => {
            console.log("error deleting workspace")
            console.log(err);
        })
    }

    static async createUserWorkspaceFile(uid, wid, fileName, extension, contents, desktop_abs_path){
        let file = await db.collection("users").doc(uid).collection("workspaces").doc(wid).collection("files").add({
            name: fileName,
            extension: extension,
            contents: contents,
            desktop_abs_path: desktop_abs_path
        }).catch((err) => {
            console.log(err);
        }).then(docRef => {
            let fileNoContents = new File(docRef.id, fileName, extension, "", desktop_abs_path);
            return fileNoContents;
        });
        return file;
    }

    static async getUserWorkspaceFiles(uid, wid, nocontents){
        let files = await db.collection("users").doc(uid).collection("workspaces").doc(wid).collection("files").get().catch((err) => {
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

    static async getUserWorkspaceFileContent(uid, wid, fid){
        let fileContent = db.collection("users").doc(uid).collection("workspaces").doc(wid).collection("files").doc(fid).get().catch((err) => {
            console.log(err)
        }).then((doc) =>{
            let data = doc.data()
            return data.contents;
        });
        return fileContent;
    }

    static async deleteUserWorkspaceFile(uid, wid, fid){
        await db.collection("users").doc(uid).collection("workspaces").doc(wid).collection("files").doc(fid).delete().catch((err) =>{
            console.log("error deleting file");
            console.log(err)
        });
    }

    static async overwriteUserWorkspaceFile(uid, wid, file){
        await UserService.deleteUserWorkspaceFile(uid, wid, file.fid);
        let newfile = await UserService.createUserWorkspaceFile(uid, wid, file.name, file.extension, file.contents, file.desktop_abs_path);
        console.log("Successfully overwrote file: ", newfile.name + newfile.extension);
    }

}

module.exports = {UserService}