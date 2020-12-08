# Mobile Coder - Desktop CLI
The Mobile Coder Desktop CLI is easy to learn, and quick to use; aiming to make the uploading/unloading process of going from your local machine to mobile and back, as simple as possible.

The following instructions assume the user has npm installed, which comes with Node.js.
## Installation
```
npm i -g @mobile-coder/mobilecoder-desktop
```
This will install the Mobile Coder Desktop CLI globally, allowing you to run it from any directory on your machine.

## Uninstall
```
npm i -g @mobile-coder/mobilecoder-desktop
```
This will uninstall the Mobile Coder Desktop CLI from the global node_modules you have installed.

## Usage
Running `mobilecoder` or `mc` from any directory after installing will launch the Mobile Coder Desktop CLI.
```
C:\Users> mobilecoder
C:\Users> mc
```
Upon starting Mobile Coder you will be presented with a greeting message: 
```
   ╔══════════════════════════════════════════════════════════════════════════════════════════╗
   ║                                          <MC/>                                           ║
   ║                         Welcome to the MobileCoder Desktop CLI!                          ║
   ║   To get a list of available commands, enter 'help' or 'help -a' to view all commands.   ║
   ╚══════════════════════════════════════════════════════════════════════════════════════════╝
```
The CLI will keep track of the ‘state’ a user is in, there being 3 states: 

0. Initial state of the Desktop CLI; no user is signed in. 
0. A user is signed in and now has access to the workspaces they are associated with.
0. A user has entered a workspace, and now has access to the files associated with that workspace.

Each set of commands has a corresponding index, 0, 1, or 2, to represent the commands currently available to that user, as well as an index 3, which represent the commands always available to a user.
## Available Commands
The following are *globally* available commands.
* **‘ls [path_to_directory]’**

* **‘clear’**

* **‘quit’**

* **‘help [-a]'**

Upon starting the Mobile Coder Desktop CLI, you enter state 0.
The following are the available non-global commands within this state.
* **'signup'**

* **'login'**

Upon logging into an existing user, you enter state 1.
The following are the available non-global commands within this state.
* **‘show workspaces’**

* **‘create workspace [workspace_name]’**

* **‘use workspace [workspace_name]’**

* **‘delete workspace [workspace_name]’**

* **‘refresh’**

* **‘signout’**

Upon entering an existing workspace, you enter state 2.
The following are the availble non-global commands within this state.
* **‘show files’**

* **‘view file [file_name]’**

* **‘add file [file_name || path_to_file_name]’**

* **‘pull file [file_name || -a]’**

* **‘delete file [file_name]’**

* **'overwrite file [file_name]'**

* **‘refresh’**

* **‘leave workspace’**


## Links
* [NPM page](https://www.npmjs.com/package/@mobile-coder/mobilecoder-desktop)
* [Our Privacy Policy](https://i6.cims.nyu.edu/~ddj231/mcterms/)

## Team Members
* Daye Jack
* Alex Hammer
* Joseph Dynkin
* Crystal Lee
* Yuexiang Liao
