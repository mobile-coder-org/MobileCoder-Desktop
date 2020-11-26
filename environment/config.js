var firebase = require("firebase/app");

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

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

module.exports = {
	firebase
};
