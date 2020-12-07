/**
 * @author Alex Hammer
 * @date November 25, 2020
 * Latest update: December 7, 2020
 * 
 * Helpers for prompts; handles our flows outlined in documentation.
 */

const rl = require("readline-sync");    //Reads user inputs synchronously 
const fs = require("fs");               //File System module for ls flow
const path = require("path");           //Utility module to work with file/directory paths (ls flow)
const chalk = require("chalk");         //Colored text outputs
const ora = require('ora');             //Loading spinners

const {UserService} = require("./services/UserService.js");     //UserService is where firestore interacting functions are held
var {firebase} = require('./environment/config.js');            //Firebase - taken from config.js, where our firebase credentials are stored (safe to be public).
require("firebase/auth");

let spinner;    //Loading spinner

class Flows {

    /**
     * Signup flow. Uses firebase authentication.
     * Prompts user for email and password, then signs them up for MobileCoder.
     */
    static async signup() {
        let email = rl.questionEMail(chalk.bold("Email: "));
        let password = rl.questionNewPassword(chalk.bold('Password: '), {
            mask: '', 
            min: 6,
            confirmMessage: "Enter the same password again: ",
            unmatchMessage: "Passwords did not match. Try again. To re-enter the first password, input only Enter.",
            limitMessage: "Password must be at least 6 characters. Please try again."
        });
        let errorCode;
        let errorMessage;
        spinner = ora("Signing up...").start();
        await firebase.auth().createUserWithEmailAndPassword(email, password).catch((error) => {
            errorCode = error.code;
            errorMessage = error.message;
        }).then(async () => {
            let checkUser = firebase.auth().currentUser;
            if(checkUser){
                let name = checkUser.email.substring(0, checkUser.email.indexOf("@"));
                let newUser = await UserService.createUser(checkUser.uid, name, checkUser.email);
                spinner.succeed(chalk.green("New user created with uid: ", newUser.uid));
            }
            else {
                spinner.fail(chalk.red("Failed to create user..."));
                if(errorCode == 'auth/email-already-in-use')
                    console.log(chalk.red("Email in use"));
                else    
                    console.log(chalk.red(errorMessage));
            }
        });
    }

    /**
     * Login flow. Uses firebase authentication.
     * Prompts user for email and password, then logs them into MobileCoder.
     */
    static async login() {
        let email = rl.questionEMail(chalk.bold("Email: "));
        let password = rl.question(chalk.bold("Password: "), {
            hideEchoBack: true,
            mask: '',
        });
        let errorCode;
        let errorMessage;
        spinner = ora("Logging in...").start();
        let user = await firebase.auth().signInWithEmailAndPassword(email,password).catch((error) => {
            errorCode = error.code;
            errorMessage = error.message;
        }).then(async () => {
            let checkUser = firebase.auth().currentUser;
            if(checkUser){
                let userInfo = await UserService.getUser(checkUser.uid, true);
                spinner.succeed(chalk.green("Successfully logged into user: ", userInfo.name));
                return userInfo;
            } else {
                spinner.fail(chalk.red("Login failed..."));
                if(errorCode == 'auth/wrong-password')
                    console.log(chalk.red("Wrong password."));
                else
                    console.log(chalk.red(errorMessage));
                return null;
            }
        });
        return user;
    }

    /**
     * Signout flow. Uses firebase authentication.
     * Signs user out of current account.
     */
    static async signout(){
        spinner = ora("Signing out...").start();
        let r  = await firebase.auth().signOut().catch((err) => {
            spinner.fail(chalk.red("An error occurred when signing out..."));
            console.log(chalk.red(err));
            return false;
        }).then(() => {
            spinner.succeed(chalk.green("Sign out successful."));
            return true;
        });
        return r;
    }

    /**
     * ls flow. Uses file system module to display list of all files in the specified directory. 
     * Directories will be appended by a '/' to mark them as directories.
     * This can be useful for uses of the MobileCoder CLI when looking to push files to firestore. 
     * @param {string} dirname - name of directory that user wants to list files.
     */
    static ls(dirname){
        if(fs.existsSync(dirname) && fs.statSync(dirname).isDirectory()){
            for(let file of fs.readdirSync(dirname)){
                if(file.indexOf('.') != 0){
                    let stats = fs.statSync(path.join(dirname + '/', file));
                    if(stats.isDirectory())
                        console.log("- " + file + "/");
                    else if(file.indexOf(".") != 0)
                        console.log("- " + file);
                }
            }
        } else 
            console.log(chalk.yellow("Invalid directory."));
    }
}

module.exports = {Flows: Flows};