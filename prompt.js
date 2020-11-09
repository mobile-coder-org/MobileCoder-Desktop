/**
* @author Alex Hammer
* @date November 7th, 2020
* 
* Prompt functions that take user inputs until user quits.
*/

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
 *      'login'/'Login':
 *          Login flow, currently prompts user for Email and Password and does nothing else. Authentication to be implemtend via Firebase.
 *      default:
 *          TBD; Not yet implemented, likely to just be error handling asking user to enter a valid input.
 */
function prompt(){
    rl.resume();
    rl.question("What would you like to do? \n>", function(input){
        switch(input){
            case "quit":
            case "Quit":
            case "q":
            case "Q":
                console.log("Goodbye!");
                rl.pause();
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
            default:
                console.log("Default case not yet implemented");
                prompt();
        }
    })
}

/**
 * Log in flow for 'login' case of prompt. Uses firebase Authentication to log user in.
 */
function login(){
    rl.question("Email: ", function(email){
        rl.question("Password: ", function(password){
            firebase.auth().signInWithEmailAndPassword(email, password);
            rl.pause();
        })
    })
}

/**
 * Sign up flow for 'signup' case of prompt. Uses firebase Authentication to sign up a user.
 */
function signup(){
    rl.question("Email: ", function(email){
        rl.question("Password: ", function(password){
            firebase.auth().createUserWithEmailAndPassword(email, password);
            rl.pause();
        })
    })
}

firebase.initializeApp(firebaseConfig);
prompt();
