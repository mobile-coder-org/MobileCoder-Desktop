# Mobile Coder - Desktop CLI
A command line client, that works with the Mobile Coder mobile app, to make code editing on mobile devices and syncing changes with a desktop machine 
simple and intuitive.

Using the client, users can create workspaces, that are synced with the Mobile Coder mobile app, and add files to their workspaces.

Code editing on the go is as simple as editing files on the mobile app, and pulling changes from mobile to desktop using this client.

## Installation

Install the Mobile Coder Desktop CLI with the command below:

```
shell> npm install -g @mobile-coder/mobilecoder-desktop 
```

## Uninstall

Uninstall the Mobile Coder Desktop CLI with the command below:

```
shell> npm uninstall -g @mobile-coder/mobilecoder-desktop
```

## Usage
Run the Mobile Coder Desktop CLI from any directory after installing with either of the commands below:
```
shell> mobilecoder

OR

shell> mc

```

## Start screen

```
   ╔══════════════════════════════════════════════════════════════════════════════════════════╗
   ║                                          <MC/>                                           ║
   ║                         Welcome to the MobileCoder Desktop CLI!                          ║
   ║   To get a list of available commands, enter 'help' or 'help -a' to view all commands.   ║
   ╚══════════════════════════════════════════════════════════════════════════════════════════╝

   MobileCoder []>
```

## Available Commands 
The following are *globally* available commands.
* **‘ls [path_to_directory]’**

* **‘clear’**

* **‘quit’**

* **‘help [-a]'**

Upon starting the Mobile Coder Desktop CLI, the following are the available non-global commands.
* **'signup'**

* **'login'**

Upon logging into an existing user, the following are the available non-global commands.
* **‘show workspaces’**

* **‘create workspace [workspace_name]’**

* **‘use workspace [workspace_name]’**

* **‘delete workspace [workspace_name]’**

* **‘refresh’**

* **‘signout’**

Upon entering an existing workspace, the following are the available non-global commands.

* **‘show files’**

* **‘view file [file_name]’**

* **‘add file [file_name || path_to_file_name]’**

* **‘pull file [file_name || -a]’**

* **‘delete file [file_name]’**

* **'overwrite file [file_name]'**

* **‘refresh’**

* **‘leave workspace’**

# Links
[NPM page](https://www.npmjs.com/package/@mobile-coder/mobilecoder-desktop)


## Team Members
* Daye Jack
* Alex Hammer
* Joseph Dynkin
* Crystal Lee
* Yuexiang Liao
