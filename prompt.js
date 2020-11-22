/**
* @author Alex Hammer
* @date November 7th, 2020
* Core of MobileCoder Desktop CLI. Prompts users for inputs until they quit, going through several of our flows outlined in documentation.
*/

const readline = require("readline");
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const {User, Workspace, File} = require('./models/models.js');

const {UserService} = require("./services/UserService.js");

var {firebase} = require('./environment/config.js');
require("firebase/auth");

/**
 * Beginning prompt function, takes user input and continuously loops (via. recursion) until a quit case is inputted.
 * Current Cases: 
 *      'quit'/'Quit'/'q'/'Q': 
 *          Quit case, 4 different cases to avoid case sensitivity
 *      'login'/'Login'/'l'/'L':
 *          Goes into login flow, prompting user for email and password and authenticating with firebase, then moves onto new prompt if successful.
 *      'signup'/'Signup'/'s'/'S':
 *          Goes into sign up flow, prompting user for email and password, and creates new account with firebase authentication if inputs are valid, and loops same prompt.
 *      'help'/'Help'/'h'/'H':
 *          Displays a list of all currently available commands.
 *      default:
 *          TBD; Not yet implemented, likely to just be error handling asking user to enter a valid input.
 */
var user = null;
function beginPrompt(){
    rl.resume();
    rl.question("MobileCoder []> ", (input) => {
        switch(input.trim()){
            case "quit":
            case "Quit":
            case "q":
            case "Q":
                rl.close();
                console.log("Goodbye!");
                break;
            case "login":
            case "Login":
            case "l":
            case "L":
                login();
                break;
            case "signup":
            case "Signup":
            case "s":
            case "S":
                signup();
                break;
            case "help":
            case "Help":
            case "h":
            case "H":
                rl.pause();
                console.log("Current available commands:\n", 
                "'q'/'quit' - Exits the program.\n",
                "'l'/'login' - Allows you to sign into an existing profile.\n",
                "'s'/'signup' - Allows you to create a new account. \n",
                "'h'/'help' - Help command to view all current available commands.\n",
                "'check user' - used for testing purposes just to make sure correct user is being used (should be null here).");
                beginPrompt();
                break;
            case "":
                rl.pause();
                beginPrompt();
                break;
            case "check user":
                rl.pause();
                console.log("Current user: ", user);
                beginPrompt();
                break;
            default:
                rl.pause();
                console.log("Default case not yet implemented");
                beginPrompt();
        }
    });
}

var currentWorkspace = {wid: "",
                        name: ""};
                        
function signedInPrompt(){
    rl.resume();
    rl.question("MobileCoder [" + currentWorkspace.name + "]> ", (input) => {

        //Parse user input to take arguments, and trim off all excess whitespaces
        input = input.trim();
        let inputParse = ["", "", ""];
        if(input.indexOf(" ") == -1){
            inputParse[0] = input;
        } else {
            inputParse[0] = input.substring(0, input.indexOf(" ") + 1);
            input = input.substring(input.indexOf(" ")).trim();
            if(input.indexOf(" ") == -1){
                inputParse[1] = (input);
            }
            else {
                inputParse[1] = input.substring(0, input.indexOf(" "));
                input = input.substring(input.indexOf(" ")).trim();
                inputParse[2] = input;
            }
        }
        
        switch(inputParse[0] + inputParse[1] + inputParse[2]){
            case "q":
                console.log("Goodbye!");
                rl.close();
                break;
            case "signout":
                rl.pause();
                firebase.auth().signOut().then(() => {
                    console.log("Sign-out successful!");
                    user = null;
                    beginPrompt();
                }).catch((error) => {
                    console.log("An error occured when signing out...");
                    console.log(error);
                    signedInPrompt();
                })
                break;
            case "create workspace" + inputParse[2]:
                rl.pause();
                var uid = user.uid;
                var workspaceName = inputParse[2];
                var creation_date =  getDate();
                UserService.createUserWorkspace(uid, workspaceName, creation_date, (workspace) => {
                    console.log("New workspace created: ", workspace);
                    signedInPrompt();
                });
                break;
            case "show workspaces":
                rl.pause();
                UserService.getUserWorkspaces(user.uid, (workspaces) =>{
                    if(workspaces.length != 0){
                        workspaces.forEach(workspace => console.log(workspace.name));
                        signedInPrompt();
                    } else {
                        console.log("Empty workspace collection.");
                        signedInPrompt();
                    }
                });
                break;
            case "use workspace" + inputParse[2]:
                rl.pause();
                if(inputParse[2] == ""){
                    console.log("Missing workspace name. Please enter a valid workspace");
                    signedInPrompt();
                } else {
                    //console.log(inputParse[2]);
                    currentWorkspace.name = inputParse[2];
                    UserService.getUserWorkspaces(user.uid, (workspaces) =>{
                        var i = 0;
                        while(i < workspaces.length && workspaces[i].name != currentWorkspace.name)
                            i++;
                        if(workspaces[i].name == currentWorkspace.name){
                            currentWorkspace.wid = workspaces[i].wid;
                            workspacePrompt();
                        } else {
                            currentWorkspace = "";
                            console.log("Invalid workspace name.");
                            signedInPrompt();
                        }
                    });
                }
                break;
            case "help":
            case "h":
                rl.pause();
                console.log("Current available commands: \n",
                "'q' - Exits the program. \n",
                "'signout - Signout out of current profile, sends back to beginning prompt. \n",
                "'create workspace [workspace name]' - Creates a new workspace and currently returns the workspace object associated with it. \n",
                "'show workspaces - Shows workspaces available to the user. \n",
                "'use workspace [workspace name] - Enter a certain workspace. Currently crashes on invalid workspace name. \n",
                "'h'/'help' - Displays list of currently available commands. \n",
                "'check user' - used for testing purposes just to make sure correct user is being used.");
                signedInPrompt();
                break;
            case "":
                rl.pause();
                signedInPrompt();
                break;
            case "check user":
                rl.pause();
                console.log("Current user: ", user);
                signedInPrompt();
                break;
            default: 
                rl.pause();
                console.log("Defaultcase not yet implemented");
                signedInPrompt();
                break;
        }
    });
}

function workspacePrompt(){
    rl.resume();
    rl.question("MobileCoder [" + currentWorkspace.name + "]> ", (input) => {

        //Parse user input to take arguments, and trim off all excess whitespaces
        input = input.trim();
        let inputParse = ["", "", ""];
        if(input.indexOf(" ") == -1){
            inputParse[0] = input;
        } else {
            inputParse[0] = input.substring(0, input.indexOf(" ") + 1);
            input = input.substring(input.indexOf(" ")).trim();
            if(input.indexOf(" ") == -1){
                inputParse[1] = (input);
            }
            else {
                inputParse[1] = input.substring(0, input.indexOf(" "));
                input = input.substring(input.indexOf(" ")).trim();
                inputParse[2] = input;
            }
        }

        switch(inputParse[0] + inputParse[1] + inputParse[2]){
            case "q":
                console.log("Goodbye!");
                rl.close();
                break;
            case "show id":
                rl.pause();
                console.log(user.uid);
                console.log(currentWorkspace.wid);
                workspacePrompt();
                break;
            case "add file" + inputParse[2]:
                console.log("Add file to be implemented.");
                workspacePrompt();
                break;
            case "show files":
                rl.pause();
                UserService.getUserWorkspaceFiles(user.uid, currentWorkspace.wid, (files) =>{
                    if(files.length != 0){
                        files.forEach(file => console.log(file.name + file.extension));
                        workspacePrompt();
                    } else {
                        console.log("Empty file collection.");
                        workspacePrompt();
                    }
                });
                break;
            case "leave workspace":
                rl.pause();
                currentWorkspace.name = "";
                console.log("*** Exiting current workspace ***");
                signedInPrompt();
                break;
            case "help":
            case "h":
                rl.pause();
                console.log("Current available commands: \n",
                "'q' - Exits the program. \n",
                "'add file [path_to_file]' - Adds a new file to the file collection in the current workspace. \n",
                "'show files'- Shows files available to the user in current worksapce (shows nothing for now). \n",
                "'leave workspace' - Allows user to leave the current workspace, sending back to previous prompt. \n",
                "'h'/'help' - Displays list of currently available commands. \n",
                "check user' - used for testing purposes just to make sure correct user is being used.");
                workspacePrompt();
                break;
            case "":
                rl.pause();
                workspacePrompt();
                break;
            case "check user":
                rl.pause();
                console.log("Current user: ", user);
                workspacePrompt();
                break;
            default:
                rl.pause();
                console.log("Default case not yet implemented.");
                workspacePrompt();
                break;
        }
    });
}

/**
 * Log in flow for 'login' case of prompt. Uses firebase Authentication to log user in.
 */
function login(){
    rl.question("Email: ", function(email){
        rl.question("Password: ", function(password){
            var errorCode;
            var errorMessage;
            firebase.auth().signInWithEmailAndPassword(email, password).catch(function(error){
                errorCode = error.code;
                errorMessage = error.message;
            }).then(() => {
                rl.pause();
                var checkUser = firebase.auth().currentUser;
                if(checkUser) {
                    user = new User(checkUser.uid, checkUser.name, checkUser.email);
                    console.log("Logged into user with email : ", user.email, "and uid: ", user.uid);  
                    signedInPrompt();          
                } else {
                    console.log("Login failed...");
                    if(errorCode === 'auth/wrong-password'){
                        console.log('Wrong Password.');
                    }
                    else 
                        console.log(errorMessage);
                    beginPrompt();
                }
            });
        });
    });
}

/**
 * Sign up flow for 'signup' case of prompt. Uses firebase Authentication to sign up a user.
 */
function signup(){
    rl.question("Email: ", function(email){
        rl.question("Password: ", function(password){
            var errorCode;
            var errorMessage;
            firebase.auth().createUserWithEmailAndPassword(email, password).catch(function(error){
                errorCode = error.code;
                errorMessage = error.message;
            }).then(() => {
                rl.pause();
                var user = firebase.auth().currentUser;
                var uid, name, email;
                if(user) {     
                    uid = user.uid;
                    name = user.email.substring(0, user.email.indexOf("@"));
                    email = user.email;
                    UserService.createUser(uid, name, email, (u) => {
                        console.log("New user created: ", u);
                        beginPrompt();
                    });
                } else {
                    console.log("Failed to create new user...");
                    if(errorCode == 'auth/email-already-in-use')
                        console.log('Email in use');
                    else   
                        console.log(errorMessage);
                    beginPrompt();
                }
            });
        });
    });
}

function getDate(){
    var d = new Date();
    var year = "" + d.getFullYear();
    var month = ("0" + (d.getMonth() + 1)).slice(-2);
    var day = ("0" + d.getDate()).slice(-2);

    return year + month + day;
}
console.log("Welcome to MobileCoder! \nTo get a list of all commands available to you, enter 'h' or 'help'! \n",
    "**Every prompt currently has a different set of commands listed in help**\n",
    "(Note: Occasionally when quitting the program may not fully terminate, so you will have to CTRL+C to exit.");
beginPrompt();
