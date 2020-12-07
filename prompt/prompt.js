/**
* @author Alex Hammer
* @date November 7, 2020
* Latest update: December 7, 2020
*
* Core of MobileCoder Desktop CLI. Prompts users for inputs until they quit, going through several of our flows outlined in documentation.
*/

const rl = require("readline-sync");        //Read user inputs synchronously
const fs = require("fs");                   //File System module
const chalk = require("chalk");             //Colored outputs
const ora = require("ora");                 //Loading spinner
const boxen = require("boxen");             //Banner for initial launch

const {User, Workspace, File} = require('../models/models.js');          //MobileCoder data models
const {FileHelper} = require("../helpers/FileHelper.js");                           //Helper functions to interact with files easier
const {UserService} = require("../helpers/UserService.js");             //Functions to interact with firestore
const {Flows} = require("./promptFlows.js");                            //Helper functions to aid in flows and clean up main prompt.

var spinner;                    //loading spinner
var continuePrompt = true;      //boolean controlling whether we quit or not
var availableCommands = [       //Array of all available commands, seperated into states 0, 1, 2, and global commands.
    //state 0 
    "'signup - Create a new profile.\n" + 
    "'login' - Login to an existing profile.", 
    //state 1
    "'show workspaces' - Displays a list of all workspaces associated with the current user.\n" +
    "'create workspace [workspace_name]' - Creates a new workspace with [workspace_name] for the current user.\n" +
    "'use workspace [workspace_name]' - Enter into workspace with [workspace_name] associated with the current user.\n" +
    "'delete workspace [workspace_name]' - Deletes the specified workspace, and all files associated with it.\n" +
    "'refresh' - Refreshes data. Use in case you have pushed a change on mobile while you were signed in on the desktop CLI.\n"+
    "'signout' - Signout of the current profile.",
    //state 2
    "'show files' - Displays a list of all files associated with the current user inside the current workspace.\n" +
    "'view file [file_name]' - Displays the contents of specified file. You can only view files stored in a workspace, you cannot view local files this way. \n" +
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

var currentWorkspace = new Workspace(null, "", null);   //Used in state 2 - Keeps track of the current workspace we are in.
var user = new User(null, "", "");                      //Used in state 1 and 2 - Keeps track of the user that is currently signed in.
var state = 0;                                          //0 - Beginning | 1 - Signed-in | 2 - In a workspace

var workspaceNames = [];                                //Used in state 1 and 2 - Keeps track of all available workspaces - makes it easier to look through.
var files = {                                           //Used in state 2 - Keeps track of all available file names and corresponding file id - makes it easier to look through.
    names: [], 
    fids: []
};

/**
 * Main prompt function, uses readline-sync's promptCL to take in inputs, and automatically parses it into an array.
 * 
 * Uses 3 switch cases - first to take care of global commands (since these should work regardless of the state we are in),
 *  then switching to current state of program, then to match to entered command.
 * 
 * 
 */
async function prompt() {
    do{
        let inputArgs = rl.promptCL({ _: () => {}}, {
            prompt: chalk.hex('#8565c4')('MobileCoder [' + currentWorkspace.name + ']> '),
        });
        let fullInput = inputArgs.join(' ').toLowerCase();

        switch(fullInput){
            //These 4 cases were used during testing only.
            /* case "check user":
                console.log(user);
                break;
            case "check state":
                console.log(state);
                break;
            case "view files":
                console.log(files);
                break;
            case "workspace names":
                console.log(workspaceNames);
                break; */
            case "":
                break;
            case "ls":
            case ("ls " + inputArgs[1]).toLowerCase():
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
                        console.log(chalk.underline(commandStates[i]));
                        console.log(availableCommands[i]+ "\n");
                    }
                } else 
                    console.log(availableCommands[state] + "\n" + availableCommands[3]);
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
                                    if(user.workspaces.length > 0){
                                        for(workspace of user.workspaces)
                                            workspaceNames.push(workspace.name.toLowerCase());
                                    }
                                }
                                break;
                            default: 
                                console.log(chalk.red("Invalid command. Enter 'help' to get a list of all currently available commands."));
                        }
                        break;
                    case 1:
                        switch(fullInput){
                            case "show workspaces":
                                if(user.workspaces.length > 0)
                                    user.workspaces.forEach((workspace) => console.log("- " + workspace.name));
                                else    
                                    console.log(chalk.yellow("Empty workspace collection."));
                                break;
                            case "create workspace " + inputArgs[2]:
                                if(inputArgs[2].length > 50){
                                    console.log(chalk.yellow("Workspace name cannot exceed 50 characters."));
                                } else {
                                    if(workspaceNames.indexOf(inputArgs[2].toLowerCase()) < 0){
                                        spinner = ora("Creating workspace...").start();
                                        let newWorkspace = await UserService.createUserWorkspace(user.uid, inputArgs[2], Date.now());
                                        if(newWorkspace){
                                            spinner.succeed(chalk.green("New workspace created with name: ", newWorkspace.name));
                                            user.workspaces.push(newWorkspace);
                                            workspaceNames.push(newWorkspace.name);
                                        } else
                                            spinner.fail(chalk.red("Unable to create workspace..."));
                                    }
                                    else   
                                        console.log(chalk.yellow("Workspace already exists.")); 
                                }
                                break;
                            case "use workspace " + inputArgs[2]:
                                i = workspaceNames.indexOf(inputArgs[2].toLowerCase());
                                if(i >= 0){
                                    state = 2;
                                    currentWorkspace = user.workspaces[i];
                                    if(currentWorkspace.files.length > 0){
                                        for(let file of currentWorkspace.files){
                                            files.names.push((file.name + file.extension).toLowerCase());
                                            files.fids.push(file.fid);
                                        }
                                    }
                                } else 
                                    console.log(chalk.yellow("Workspace does not exist."));
                                break;
                            case "delete workspace " + inputArgs[2]:
                                i = workspaceNames.indexOf(inputArgs[2].toLowerCase());
                                if(i >= 0){
                                    let warning = rl.keyInYNStrict(chalk.yellow("Warning: deleting a workspace deletes all files inside of the workspace. Do you wish to continue?"));
                                    if(warning){
                                        spinner = ora("Deleting workspace and all files within...\n").start();
                                        let fids = [];
                                        for(let file of user.workspaces[i].files)
                                            fids.push(file.fid);
                                        if(await UserService.deleteUserWorkspace(user.uid, user.workspaces[i].wid, fids)){
                                            user.workspaces.splice(i, 1);
                                            workspaceNames.splice(i, 1);
                                            spinner.succeed(chalk.green("Workspace " + inputArgs[2] + " successfully deleted."));
                                        } else 
                                            spinner.fail(chalk.red("Unable to delete workspace..."));
                                    } else
                                        console.log(chalk.yellow("Did not delete workspace."));
                                } else
                                    console.log(chalk.yellow("Invalid workspace name."));
                                break;
                            case "refresh":
                                spinner = ora("Refreshing user data...").start();
                                user = await UserService.getUser(user.uid, true);
                                workspaceNames = [];
                                files.names = [];
                                files.fids = [];
                                if(user) {
                                    if(user.workspaces.length > 0){
                                        for(workspace of user.workspaces)
                                            workspaceNames.push(workspace.name.toLowerCase());
                                    }
                                    spinner.succeed(chalk.green("User data refreshed."));
                                }
                                else{
                                    spinner.fail(chalk.red("Refresh failed... Returning to initial state."));
                                    state = 0;
                                }
                                break;
                            case "signout":
                                if(await Flows.signout()){
                                    user = new User(null, "", "");
                                    workspaceNames = [];
                                    state = 0;
                                }
                                break;
                            default: 
                                console.log(chalk.red("Invalid command. Enter 'help' to get a list of all currently available commands."));
                        }
                        break;
                    case 2:
                        switch(fullInput){
                            case "show files":
                                if(currentWorkspace.files.length > 0)
                                    for(let file of currentWorkspace.files)
                                        console.log("- " + file.name+file.extension)
                                else   
                                    console.log(chalk.yellow("Empty file collection"));
                                break;
                            case ("view file " + inputArgs[2]).toLowerCase():
                                i = files.names.indexOf(inputArgs[2].toLowerCase());
                                if(i >= 0){
                                    spinner = ora("Loading file contents...").start();
                                    let fileName = currentWorkspace.files[i].name;
                                    let contents = await UserService.getUserWorkspaceFileContent(user.uid, currentWorkspace.wid, files.fids[i]); 
                                    let extension = currentWorkspace.files[i].extension;
                                    spinner.stop();
                                    console.log(chalk.underline.bold("Viewing file: ", fileName+extension + "\n"));
                                    console.log(contents);
                                    let pull = rl.keyInYNStrict(chalk.bold("\nWould you like to pull this file?"));
                                    if(pull){
                                        if(await FileHelper.createFile(fileName, contents, extension))
                                            console.log(chalk.green("Created new file: ", fileName + extension, " in current directory."));
                                        else
                                            console.log(chalk.red("Failed to create file..."));
                                    }
                                } else 
                                    console.log(chalk.yellow("File does not exist."));
                                break;
                            case ("add file " + inputArgs[2]).toLowerCase():
                                if(fs.existsSync(inputArgs[2])){
                                    let fileName = inputArgs[2].substring(0, inputArgs[2].lastIndexOf('.')).split('\\').pop().split('/').pop();
                                    let desktop_abs_path = FileHelper.getAbsolutePath(inputArgs[2]);
                                    let extension = FileHelper.getFileExt(desktop_abs_path);
                                    let contents = FileHelper.openFile(desktop_abs_path);
                                    i = files.names.indexOf((fileName+extension).toLowerCase());
                                    if(i < 0){
                                        spinner = ora("Adding file...").start();
                                        let newFile = await UserService.createUserWorkspaceFile(user.uid, currentWorkspace.wid, fileName, extension, contents, desktop_abs_path);
                                        if(newFile){
                                            currentWorkspace.files.push(newFile);
                                            files.names.push((newFile.name + newFile.extension).toLowerCase());
                                            files.fids.push(newFile.fid);
                                            spinner.succeed(chalk.green("Successfully added file: ", newFile.name+newFile.extension));
                                        } else  
                                            spinner.fail(chalk.red("Unable to add file to workspace..."));
                                    } else{
                                        let overwrite = rl.keyInYNStrict("File already exists. Would you like to overwrite?");
                                        if(overwrite){
                                            let newFile = new File(files.fids[i], fileName, extension, contents, desktop_abs_path);
                                            spinner = ora("Overwriting file...").start();
                                            let overwriteFile = await UserService.overwriteUserWorkspaceFile(user.uid, currentWorkspace.wid, newFile)
                                            if(overwriteFile){
                                                files.fids[i] = overwriteFile.fid;
                                                currentWorkspace.files[i] = overwriteFile;
                                                spinner.succeed(chalk.green("Successfully overwrote file: ", newFile.name + newFile.extension));
                                            }
                                            else
                                                spinner.fail(chalk.red("Failed to overwrite file..."));
                                        } else
                                            console.log(chalk.yellow("Did not add file..."));
                                    }
                                } else 
                                    console.log(chalk.red("File does not exist. Please double check you're entering the correct file_name or path_to_file_name, with an extension."));
                                break;
                            case ("pull file " + inputArgs[2]).toLowerCase():
                                if(inputArgs[2] == "-a"){
                                    let fileName, contents, extension;
                                    for(let file of currentWorkspace.files){
                                        spinner = ora("Pulling details of file: " + file.name+file.extension + "...\n").start();
                                        fileName = file.name;
                                        contents = await UserService.getUserWorkspaceFileContent(user.uid, currentWorkspace.wid, file.fid);
                                        extension = file.extension;
                                        if(await FileHelper.createFile(fileName, contents, extension))
                                            spinner.succeed(chalk.green("Created new file: ", fileName + extension, " in current directory."));
                                        else    
                                            spinner.fail(chalk.red("Failed to create file: ", fileName + extension));
                                    }
                                } else{
                                    i = files.names.indexOf(inputArgs[2].toLowerCase());
                                    if(i >= 0){
                                        spinner = ora("Pulling file details...\n").start();
                                        let fileName = currentWorkspace.files[i].name;
                                        let contents = await UserService.getUserWorkspaceFileContent(user.uid, currentWorkspace.wid, files.fids[i]);
                                        let extension = currentWorkspace.files[i].extension;
                                        if(await FileHelper.createFile(fileName, contents, extension))
                                            spinner.succeed(chalk.green("Created new file: ", fileName + extension, " in current directory."));
                                        else
                                            spinner.fail(chalk.red("Failed to create file..."));
                                    } else  
                                        console.log(chalk.red("File doesn't exist in this workspace. Please double check you're entering the correct file_name, with an extension."));
                                }
                                break;
                            case ("delete file " + inputArgs[2]).toLowerCase():
                                i = files.names.indexOf(inputArgs[2].toLowerCase());
                                if(i >= 0){
                                    spinner = ora("Deleting file...").start();
                                    if(await UserService.deleteUserWorkspaceFile(user.uid, currentWorkspace.wid, files.fids[i])){
                                        currentWorkspace.files.splice(i, 1);
                                        files.names.splice(i, 1);
                                        spinner.succeed("File successfully deleted.");
                                    } else 
                                        spinner.fail(chalk.red("Unable to delete file in current workspace..."));
                                } else 
                                    console.log(chalk.red("Invalid file name."));
                                break;
                            case ("overwrite file " + inputArgs[2]).toLowerCase():
                                i = files.names.indexOf(inputArgs[2].toLowerCase());
                                if(i >= 0){
                                    let name = inputArgs[2].substring(0, inputArgs[2].lastIndexOf('.')).split('\\').pop().split('/').pop();
                                    let abs_path = FileHelper.getAbsolutePath(inputArgs[2]);
                                    let ext = FileHelper.getFileExt(abs_path);
                                    let content = FileHelper.openFile(abs_path);
                                    let overwriteFile = new File(files.fids[i], name, ext, content, abs_path);
                                    spinner = ora("Overwriting file...").start();
                                    let newFile = await UserService.overwriteUserWorkspaceFile(user.uid, currentWorkspace.wid, overwriteFile)
                                    if(newFile){
                                        files.fids[i] = newFile.fid;
                                        currentWorkspace.files[i] = newFile;
                                        spinner.succeed(chalk.green("Successfully overwrote file: ", newFile.name + newFile.extension));
                                    }
                                    else
                                        spinner.fail(chalk.red("Failed to overwrite file..."));
                                } else
                                    console.log(chalk.red("Invalid or non-existing file name."));
                                break;
                            case "refresh":
                                spinner = ora("Refreshing user data...").start();
                                user = await UserService.getUser(user.uid, true);
                                workspaceNames = [];
                                files.names = [];
                                files.fids = [];
                                if(user){
                                    if(user.workspaces.length > 0){
                                        for(workspace of user.workspaces)
                                            workspaceNames.push(workspace.name.toLowerCase());
                                    }
                                    i = workspaceNames.indexOf(currentWorkspace.name.toLowerCase());
                                    if(i >= 0){
                                        currentWorkspace = user.workspaces[i];
                                        if(currentWorkspace.files.length > 0){
                                            for(let file of currentWorkspace.files){
                                                files.names.push((file.name + file.extension).toLowerCase());
                                                files.fids.push(file.fid);
                                            } 
                                        }
                                        spinner.succeed(chalk.green("User data refreshed."));
                                    } else {
                                        spinner.stop();
                                        console.log(chalk.yellow("Refresh found workspace to be deleted. Exiting workspace..."));
                                        currentWorkspace = new Workspace(null, "", null);
                                        state = 1;
                                    }
                                } else {
                                    spinner.fail(chalk.red("Refresh failed... Returning to initial state."));
                                    state = 0;
                                }
                                break;
                            case "leave workspace":
                                currentWorkspace = new Workspace(null, "", null);
                                files.names = [];
                                files.fids = [];
                                state = 1;
                                break;
                            default: 
                                console.log(chalk.red("Invalid command. Enter 'help' to get a list of all currently available commands."));
                        }
                        break; 
            }
        }
    } while(continuePrompt);
}

console.log(boxen(chalk.hex('#8565c4')(
    "<MC/>\n" + 
    "Welcome to the MobileCoder Desktop CLI!\n" + 
    "To get a list of available commands, enter 'help' or 'help -a' to view all commands."), {
    margin: 1,
    padding: {top: 0, bottom: 0, left: 3, right: 3},
    align: 'center',
    borderStyle: 'double',
    borderColor: '#8565c4', 
}));

module.exports = {prompt}
