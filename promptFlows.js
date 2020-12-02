/**
 * @author Alex Hammer
 * @date November 25, 2020
 * 
 * Helpers for prompts; handles our flows outlined in documentation.
 */

const rl = require("readline-sync");
const fs = require("fs");
const path = require("path");

const {UserService} = require("./services/UserService.js");
var {firebase} = require('./environment/config.js');
const { User } = require("./models/models.js");
require("firebase/auth");

class Flows {

    /**
     * Signup flow. Uses firebase authentication.
     */
    static async signup() {
        let email = rl.questionEMail();
        let password = rl.questionNewPassword('Password: ', {
            mask: '', 
            min: 6,
            confirmMessage: "Enter the same password again: ",
            unmatchMessage: "Passwords did not match. Try again. To re-enter the first password, input only Enter.",
            limitMessage: "Password must be at least 6 characters. Please try again."
        });
        let errorCode;
        let errorMessage;
        await firebase.auth().createUserWithEmailAndPassword(email, password).catch((error) => {
            errorCode = error.code;
            errorMessage = error.message;
        }).then(async () => {
            let checkUser = firebase.auth().currentUser;
            if(checkUser){
                let name = checkUser.email.substring(0, checkUser.email.indexOf("@"));
                let newUser = await UserService.createUser(checkUser.uid, name, checkUser.email);
                console.log("New user created with uid: ", newUser.uid);
            }
            else {
                console.log("Failed to create user...");
                if(errorCode == 'auth/email-already-in-use')
                    console.log("Email in use");
                else    
                    console.log(errorMessage);
            }
        });
    }

    /**
     * Login flow. Uses firebase authentication.
     */
    static async login() {
        let email = rl.questionEMail("Email: ");
        let password = rl.question("Password: ", {
            hideEchoBack: true,
            mask: '',
        });
        let errorCode;
        let errorMessage;
        let user = await firebase.auth().signInWithEmailAndPassword(email,password).catch((error) => {
            errorCode = error.code;
            errorMessage = error.message;
        }).then(async () => {
            let checkUser = firebase.auth().currentUser;
            if(checkUser){
                let userInfo = await UserService.getUser(checkUser.uid, true);
                return userInfo;
            } else {
                console.log("Login failed...");
                if(errorCode == 'auth/wrong-password')
                    console.log("Wrong password.");
                else
                    console.log(errorMessage);
                return null;
            }
        });
        return user;
    }

    static async signout(){
        await firebase.auth().signOut().catch((error) => {
            console.log("An error occurred while signing out...");
            console.log(error);
        }).then(() => {
            console.log("Sign out successful.");
            return null;
        });
    }

    static ls(dirname){
        for(file of fs.readdirSync(dirname, {withFileTypes: true}) ){
            if(file.indexOf('.') != 0){
                let stats = fs.statSync(path.join(dirname + '/', file));
                if(stats.isDirectory())
                    console.log('* ' + dirname +'/'+ file);
                else if(file.indexOf('.') != 0)
                    console.log('* ' + file);
            }
        }
    }
}

module.exports = {Flows: Flows};