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

const {firebase} = require('./environment/config.js');
require("firebase/auth");


continuePrompt = true;
let availableCommands = [
    //state 1 
    "'signup - Create a new profile.\n" + 
    "'login' - Login to an existing profile.\n" + 
    "'quit' - Exits the program. \n" + 
    "'help' - Displays a list of all currently available commands.", 
    //state 2
    "'show workspaces' - Displays a list of all workspaces associated with the current user.\n" +
    "'create workspace [workspace_name]' - Creates a new workspace with [workspace_name] for the current user.\n" +
    "'use workspace [workspace_name]' - Enter into workspace with [workspace_name] associated with the current user.\n" +
    "'refresh' - Refreshes data. Use in case you have pushed a change on mobile while you were signed in on the desktop CLI.\n"+
    "'signout' - Signout of the current profile.\n" +
    "'quit' - Exits the program.\n" + 
    "'help' - Displays a list of all currently available commands.",
    //state 3
    "'show files' - Displays a list of all files associated with the current user inside the current workspace.\n" +
    "'add file [file_name || path_to_file_name]' - Adds an existing file to the current workspace. Be sure to specify an extension when entering the file name.\n" + 
    "'pull file [file_name || -a] - Pulls a file [file_name] to local machine in current directory. [-a] to pull all files in current workspace.\n" +
    "'refresh' - Refreshes data. Use in case you have pushed a change on mobile while you were signed in on the desktop CLI.\n" +
    "'leave workspace' - Leaves the current workspace.\n" + 
    "'quit' - Exits the program.\n" + 
    "'help' - Displays a list of all currently available commands." 

];
var currentWorkspace = new Workspace(null, "", null);
var user;
var state = 0; //0 - Beginning | 1 - Signed-in | 2 - In a workspace
async function prompt() {
    do{
        let inputArgs = rl.promptCL({ _: () => {}}, {
            prompt: 'MobileCoder [' + currentWorkspace.name + ']> ',
        });
        let fullInput = inputArgs.join(' ');

        switch(fullInput){
            case "help":
                console.log(availableCommands[state]);
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
                                let i = workspaceNames.indexOf(inputArgs[2]);
                                if(i >= 0){
                                    state = 2;
                                    currentWorkspace = user.workspaces[i];
                                } else 
                                    console.log("Workspace does not exist.");
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
                                     fids: []};
                        for(file of currentWorkspace.files){
                            files.names.push(file.name + file.extension)
                            files.fids.push(file.fid);
                        };
                        switch(fullInput){
                            case "show files":
                                if(files.names.length > 0)
                                    for(fileName of files.names)
                                        console.log(fileName)
                                else   
                                    console.log("Empty file collection");
                                break;
                            case "add file " + inputArgs[2]:
                                if(fs.existsSync(inputArgs[2])){
                                    if(files.indexOf(inputArgs[2]) < 0){
                                        let fileName = inputArgs[2].substring(0, inputArgs[2].lastIndexOf('.')).split('\\').pop().split('/').pop();
                                        let desktop_abs_path = FileHelper.getAbsolutePath(inputArgs[2]);
                                        let extension = FileHelper.getFileExt(desktop_abs_path);
                                        let contents = FileHelper.openFile(desktop_abs_path);
                                        let newFile = await UserService.createUserWorkspaceFile(user.uid, currentWorkspace.wid, fileName, extension, contents, desktop_abs_path);
                                        currentWorkspace.files.push(newFile);
                                    }
                                } else 
                                    console.log("File does not exist. Please double check you're entering the correct file_name or path_to_file_name, with an extension.")
                                break;
                            case "pull file " + inputArgs[2]:
                                if(inputArgs[2] == "-a"){
                                    let fileName, contents, extension;
                                    for(file of currentWorkspace.files){
                                        fileName = file.name;
                                        contents = await UserService.getUserWorkspaceFileContent(user.uid, currentWorkspace.wid, file.fid);
                                        extension = file.extension;
                                        if(await FileHelper.createFile(fileName, contents, extension))
                                            console.log("Created new file: ", fileName + extension, " in current directory.");
                                        else    
                                            console.log("Failed to create file: ", fileName + extension);
                                    }
                                } else{
                                    let i = files.names.indexOf(inputArgs[2]);
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
                            case "refresh":
                                user = await UserService.getUser(user.uid, true);
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