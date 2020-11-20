/**
* @author Alex Hammer
* @date November 7th, 2020
* Core of MobileCoder Desktop CLI. Prompts users for inputs until they quit, going through several of our flows outlined in documentation.
*/

const {User} = require('./models/models.js');
const {Workspace} = require('./models/models.js');
const {File} = require('./models/models.js')

const readline = require("readline");
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
var firebase = require('firebase/app');
require("firebase/auth");

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDid2QqX_FubeW8euEBE-iMnWmLJCh5eqk",
  authDomain: "mobilecoder-cf2ea.firebaseapp.com",
  databaseURL: "https://mobilecoder-cf2ea.firebaseio.com",
  projectId: "mobilecoder-cf2ea",
  storageBucket: "mobilecoder-cf2ea.appspot.com",
  messagingSenderId: "409368131515",
  appId: "1:409368131515:web:ad9bb0eb12dd518cfb769e",
  measurementId: "G-LSBZPKF91D"
};

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
                console.log("Goodbye!");
                rl.close();
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
                console.log("Current available commands:\n", 
                "'q'/'quit' - Exits the program.\n",
                "'l'/'login' - Allows you to sign into an existing profile.\n",
                "'s'/'signup' - Allows you to create a new account. \n",
                "'h'/'help' - Help command to view all current available commands.\n",
                "'check user' - used for testing purposes just to make sure correct user is being used (should be null here).");
                rl.pause();
                beginPrompt();
                break;
            case "":
                rl.pause();
                beginPrompt();
                break;
            case "check user":
                console.log("Current user: ", user);
                rl.pause();
                beginPrompt();
                break;
            default:
                console.log("Default case not yet implemented");
                rl.pause();
                beginPrompt();
        }
    });
}

var currentWorkspace = "";
function signedInPrompt(){
    rl.resume();
    rl.question("MobileCoder [" + currentWorkspace + "]> ", (input) => {

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
                firebase.auth().signOut().then(() => {
                    console.log("Sign-out successful!");
                    user = null;
                    rl.pause();
                    beginPrompt();
                }).catch((error) => {
                    console.log("An error occured when signing out...");
                    console.log(error);
                    rl.pause();
                    signedInPrompt();
                })
                break;
            case "show workspaces":
                console.log("Get workspaces function to be implemented");
                console.log(user.workspaces);
                rl.pause();
                signedInPrompt();
                break;
            case "use workspace" + inputParse[2]:
                if(inputParse[2] == ""){
                    console.log("Missing workspace name. Please enter a valid workspace");
                    rl.pause();
                    signedInPrompt();
                }
                currentWorkspace = inputParse[2];
                //NEED TO ADD: VALIDITY CHECK OF CURRENT WORKSPACE (if it exists in current user's workspaces)
                rl.pause();
                workspacePrompt();
                break;
            case "help":
            case "h":
                console.log("Current available commands: \n",
                "'q' - Exits the program. \n",
                "'signout - Signout out of current profile, sends back to beginning prompt.",
                "'show workspaces - Shows workspaces available to the user (will only show an empty list for now). \n",
                "'use workspace - Enter a certain workspace. Currently will enter a workspace regardless of whether or not it actually exists. \n",
                "'check user' - used for testing purposes just to make sure correct user is being used.\n",
                "'h'/'help' - Displays list of currently available commands.");
                rl.pause();
                signedInPrompt();
                break;
            case "":
                rl.pause();
                signedInPrompt();
                break;
            case "check user":
                console.log("Current user: ", user);
                rl.pause();
                signedInPrompt();
                break;
            default: 
                console.log("Defaultcase not yet implemented");
                rl.pause();
                signedInPrompt();
                break;
        }
    });
}

function workspacePrompt(){
    rl.resume();
    rl.question("MobileCoder [" + currentWorkspace + "]> ", (input) => {

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
            case "show files":
                console.log("Get workspace files function to be implemented");
                //Need to add validity check on entering workspace flow in the signedInPrompt, otherwise the below line will crash.
                //console.log(user.workspaces[user.workspaces.indexOf(currentWorkspace)].files);
                rl.pause();
                workspacePrompt();
                break;
            case "leave workspace":
                currentWorkspace = "";
                console.log("*** Exiting current workspace ***");
                rl.pause();
                signedInPrompt();
                break;
            case "help":
            case "h":
                console.log("Current available commands: \n",
                "'q' - Exits the program. \n",
                "'show files'- Shows files available to the user in current worksapce (shows nothing for now). \n",
                "'leave workspace' - allows user to leave the current workspace, sending back to signedInPrompt. \n",
                "'check user' - used for testing purposes just to make sure correct user is being used.\n",
                "'h'/'help' - Displays list of currently available commands.");
                rl.pause();
                workspacePrompt();
                break;
            case "":
                rl.pause();
                workspacePrompt();
                break;
            case "check user":
                console.log("Current user: ", user);
                rl.pause();
                workspacePrompt();
                break;
            default:
                console.log("Default case not yet implemented.");
                rl.pause();
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
                var email, uid;
                if(user) {
                    email = user.email;      
                    uid = user.uid;
                    console.log("New user created with email : ", email, "and uid: ", uid);             
                } else {
                    console.log("Failed to create new user...");
                    if(errorCode == 'auth/email-already-in-use')
                        console.log('Email in use');
                    else   
                        console.log(errorMessage);
                }
                beginPrompt();
            });
        });
    });
}

firebase.initializeApp(firebaseConfig);

console.log("Welcome to MobileCoder! \nTo get a list of all commands available to you, enter 'h' or 'help'! \n*(Note every prompt currently has a different set of commands listed in help)*");
beginPrompt();