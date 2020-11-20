export class User {
    constructor(uid, name, email, workspaces){
        this.uid = uid;
        this.name = name;
        this.email = email;
        this.workspaces = workspaces ? workspaces : [];
    }
}

export class Workspace {
    constructor(wid, name, creation_date, files){
        this.wid = wid;
        this.name = name;
        this.creation_date = creation_date;
        this.files = files ? files : [];
    }
}

export class File {
    constructor(fid, name, extension, contents, desktop_abs_path){
        this.fid = fid;
        this.name = name;
        this.extension = extension;
        this.contents = contents;
        this.desktop_abs_path = desktop_abs_path;
    }
}