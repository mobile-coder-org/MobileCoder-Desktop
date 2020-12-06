/**
* @author Alex Hammer
* @date November 7th, 2020
* Core of MobileCoder Desktop CLI. Prompts users for inputs until they quit, going through several of our flows outlined in documentation.
*/

const rl = require("readline-sync");
const fs = require("fs");

const {User, Workspace, File} = require('./models/models.js');
const {FileHelper} = require("./helpers.js");
const {UserService} = require("./services/UserService.js");
const {Flows} = require("./promptFlows.js");

continuePrompt = true;
let availableCommands = [
    //state 1 
    "'signup - Create a new profile.\n" + 
    "'login' - Login to an existing profile.", 
    //state 2
    "'show workspaces' - Displays a list of all workspaces associated with the current user.\n" +
    "'create workspace [workspace_name]' - Creates a new workspace with [workspace_name] for the current user.\n" +
    "'use workspace [workspace_name]' - Enter into workspace with [workspace_name] associated with the current user.\n" +
    "'delete workspace [workspace_name]' - Deletes the specified workspace, and all files associated with it.\n" +
    "'refresh' - Refreshes data. Use in case you have pushed a change on mobile while you were signed in on the desktop CLI.\n"+
    "'signout' - Signout of the current profile.",
    //state 3
    "'show files' - Displays a list of all files associated with the current user inside the current workspace.\n" +
    "'add file [file_name || path_to_file_name]' - Adds an existing file to the current workspace. Be sure to specify an extension when entering the file name.\n" + 
    "'pull file [file_name || -a] - Pulls a file [file_name] to local machine in current directory. [-a] to pull all files in current workspace.\n" +
    "'delete file [file_name]' - Deletes the specified file from the current workspace. \n" +
    "'overwrite file [file_name]' - Overwrites the specified file in database with the local version. \n" + 
    "'refresh' - Refreshes data. Use in case you have pushed a change on mobile while you were signed in on the desktop CLI.\n" +
    "'leave workspace' - Leaves the current workspace.",
    //Global/always available commands
    "'ls [path_to_directory]' - Displays a list of files in specified directory, or in current directory if none is specified. \n" +
    "'clear' - Clears the console output.\n" +
    "'quit' - Exits the program.\n" + 
    "'help [optional: -a]' - Displays a list of all currently available commands. Use with '-a' flag to display list of all commands." 
];

var currentWorkspace = new Workspace(null, "", null);
var user = new User(null, "", "");
var state = 0; //0 - Beginning | 1 - Signed-in | 2 - In a workspace

async function prompt() {
    do{
        let inputArgs = rl.promptCL({ _: () => {}}, {
            prompt: 'MobileCoder [' + currentWorkspace.name + ']> ',
        });
        let fullInput = inputArgs.join(' ');

        switch(fullInput){
            case "ls":
            case "ls " + inputArgs[1]:
                let dirname;
                if(inputArgs[1])
                    dirname = inputArgs[1];
                else 
                    dirname = ".";
                Flows.ls(dirname);
                break;
            case "clear":
                console.clear();
                break;
            case "help":
            case "help -a": 
                if(inputArgs[1] == "-a"){
                    let commandStates = ["Initial state commands", "Logged in state commands", "Inside a workspace state commands", "Global commands"]
                    for(let i = 0; i < availableCommands.length; i++){
                        console.log(commandStates[i]);
                        console.log(availableCommands[i]);
                    }
                } else 
                    console.log(availableCommands[state] + "\n" + availableCommands[3]);
                break;
            case "check user":
                console.log(user);
                break;
            case "check state":
                console.log(state);
                break;
            case "quit":
                continuePrompt = false;
                process.exit();
                break;
            default:
                let i;
                switch(state){
                    case 0:
                        switch(fullInput){
                            case "signup":
                                await Flows.signup();
                                break;
                            case "login":
                                user = await Flows.login();
                                if(user){
                                    state = 1;
                                    console.log("Successfully logged into user with uid: ", user.uid);
                                }
                                break;
                            default: 
                                console.log("Invalid command. Enter 'help' to get a list of all currently available commands.");
                        }
                        break;
                    case 1:
                        let workspaceNames = [];
                        for(workspace of user.workspaces)
                            workspaceNames.push(workspace.name);
                        switch(fullInput){
                            case "show workspaces":
                                if(user.workspaces.length > 0)
                                    user.workspaces.forEach((workspace) => console.log("* " + workspace.name));
                                else    
                                    console.log("Empty workspace collection.");
                                break;
                            case "create workspace " + inputArgs[2]:
                                if(workspaceNames.indexOf(inputArgs[2]) < 0){   
                                    let newWorkspace = await UserService.createUserWorkspace(user.uid, inputArgs[2], Date.now());
                                    user.workspaces.push(newWorkspace);
                                }
                                else   
                                    console.log("Workspace already exists."); 
                                break;
                            case "use workspace " + inputArgs[2]:
                                i = workspaceNames.indexOf(inputArgs[2]);
                                if(i >= 0){
                                    state = 2;
                                    currentWorkspace = user.workspaces[i];
                                    currentWorkspaceIndex = i;
                                } else 
                                    console.log("Workspace does not exist.");
                                break;
                            case "delete workspace " + inputArgs[2]:
                                i = workspaceNames.indexOf(inputArgs[2]);
                                if(i >= 0){
                                    let fids = [];
                                    for(let file of user.workspaces[i].files)
                                        fids.push(file.fid);
                                    await UserService.deleteUserWorkspace(user.uid, user.workspaces[i].wid, fids);
                                    user.workspaces.splice(i, 1);
                                } else
                                    console.log("Invalid workspace name.");
                                break;
                            case "refresh":
                                user = await UserService.getUser(user.uid, true);
                                break;
                            case "signout":
                                user = await Flows.signout();
                                if(!user)
                                    state = 0;
                                break;
                            default: 
                                console.log("Invalid command. Enter 'help' to get a list of all currently available commands.");
                        }
                        break;
                    case 2:
                        let files = {names: [], 
                                     fids: []}
                        for(let file of currentWorkspace.files){
                            files.names.push(file.name + file.extension)
                            files.fids.push(file.fid);
                        }
                        switch(fullInput){
                            case "show files":
                                if(currentWorkspace.files.length > 0)
                                    for(let file of currentWorkspace.files)
                                        console.log(file.name+file.extension)
                                else   
                                    console.log("Empty file collection");
                                break;
                            case "add file " + inputArgs[2]:
                                if(fs.existsSync(inputArgs[2])){
                                    let fileName = inputArgs[2].substring(0, inputArgs[2].lastIndexOf('.')).split('\\').pop().split('/').pop();
                                    let desktop_abs_path = FileHelper.getAbsolutePath(inputArgs[2]);
                                    let extension = FileHelper.getFileExt(desktop_abs_path);
                                    let contents = FileHelper.openFile(desktop_abs_path);
                                    i = files.names.indexOf(fileName+extension);
                                    if(i < 0){
                                        let newFile = await UserService.createUserWorkspaceFile(user.uid, currentWorkspace.wid, fileName, extension, contents, desktop_abs_path);
                                        if(newFile){
                                            currentWorkspace.files.push(newFile);
                                            files.names.push(newFile.name);
                                            files.fids.push(newFile.fid);
                                            console.log("Successfully added file: ", newFile.name+newFile.extension);
                                        } else 
                                            console.log("error creating file");
                                    } else{
                                        let overwrite = rl.keyInYNStrict("File already exists. Would you like to overwrite?");
                                        if(overwrite){
                                            let newFile = new File(files.fids[i], fileName, extension, contents, desktop_abs_path)
                                            await UserService.overwriteUserWorkspaceFile(user.uid, currentWorkspace.wid, newFile);
                                        }
                                        else
                                            console.log("Failed to add file...");
                                    }
                                } else 
                                    console.log("File does not exist. Please double check you're entering the correct file_name or path_to_file_name, with an extension.")
                                break;
                            case "pull file " + inputArgs[2]:
                                if(inputArgs[2] == "-a"){
                                    let fileName, contents, extension;
                                    for(let file of currentWorkspace.files){
                                        fileName = file.name;
                                        contents = await UserService.getUserWorkspaceFileContent(user.uid, currentWorkspace.wid, file.fid);
                                        extension = file.extension;
                                        if(await FileHelper.createFile(fileName, contents, extension))
                                            console.log("Created new file: ", fileName + extension, " in current directory.");
                                        else    
                                            console.log("Failed to create file: ", fileName + extension);
                                    }
                                } else{
                                    i = files.names.indexOf(inputArgs[2]);
                                    if(i >= 0){
                                        let fileName = currentWorkspace.files[i].name;
                                        let contents = await UserService.getUserWorkspaceFileContent(user.uid, currentWorkspace.wid, files.fids[i]);
                                        let extension = currentWorkspace.files[i].extension;

                                        if(await FileHelper.createFile(fileName, contents, extension))
                                            console.log("Created new file: ", fileName + extension, " in current directory.");
                                        else
                                            console.log("Failed to create file...");
                                    } else  
                                        console.log("File doesn't exist in this workspace. Please double check you're entering the correct file_name, with an extension.");
                                }
                                break;
                            case "delete file " + inputArgs[2]:
                                i = files.names.indexOf(inputArgs[2])
                                if(i >= 0){
                                    await UserService.deleteUserWorkspaceFile(user.uid, currentWorkspace.wid, files.fids[i])
                                    currentWorkspace.files.splice(i, 1);
                                } else 
                                    console.log("Invalid file name.");
                                break;
                            case "overwrite file " + inputArgs[2]:
                                i = files.names.indexOf(inputArgs[2])
                                if(i >= 0){
                                    let name = inputArgs[2];
                                    let abs_path = FileHelper.getAbsolutePath(inputArgs[2]);
                                    let ext = FileHelper.getFileExt(abs_path);
                                    let content = FileHelper.openFile(abs_path);
                                    let newfile = new File(files.fids[i], name, ext, content, abs_path);
                                    await UserService.overwriteUserWorkspaceFile(user.uid, currentWorkspace.wid, newfile.fid);
                                } else
                                    console.log("Invalid or non-existing file name.")
                                break;
                            case "refresh":
                                user = await UserService.getUser(user.uid, true);
                                let workspaceNames = [];
                                for(workspace of user.workspaces)
                                    workspaceNames.push(workspace.name);
                                i = workspaceNames.indexOf(currentWorkspace.name);
                                if(i >= 0){
                                    currentWorkspace = user.workspaces[i];
                                    files = {names: [], 
                                        fids: []};
                                    for(let file of currentWorkspace.files){
                                        files.names.push(file.name + file.extension)
                                        files.fids.push(file.fid);
                                    }
                                }
                                else{
                                    console.log("Refresh found workspace to be deleted. Exiting workspace...");
                                    currentWorkspace = new Workspace(null, "", null);
                                    state = 1;
                                }
                                break;
                            case "leave workspace":
                                currentWorkspace = new Workspace(null, "", null);
                                state = 1;
                                break;
                            default: 
                                console.log("Invalid command. Enter 'help' to get a list of all currently available commands.");
                        }
                        break; 
            }
        }
    } while(continuePrompt);
}

prompt();
