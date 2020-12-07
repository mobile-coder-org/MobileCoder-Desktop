/**
 * @author Daye Jack
 * @date November 20, 2020
 * Latest update: N/A
 * 
 * Models for our MobileCoder application. 
 * These models are built similarly to our firestore storage is built.
 */
class User {
    constructor(uid, name, email, workspaces){
        this.uid = uid;
        this.name = name;
        this.email = email;
        this.workspaces = workspaces ? workspaces : [];
    }
}

class Workspace {
    constructor(wid, name, creation_date, files){
        this.wid = wid;
        this.name = name;
        this.creation_date = creation_date;
        this.files = files ? files : [];
    }
}

class File {
    constructor(fid, name, extension, contents, desktop_abs_path){
        this.fid = fid;
        this.name = name;
        this.extension = extension;
        this.contents = contents;
        this.desktop_abs_path = desktop_abs_path;
    }
}

module.exports = {
	User, Workspace, File
}
