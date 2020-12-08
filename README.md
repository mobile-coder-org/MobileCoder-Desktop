# Mobile Coder - Desktop CLI
A desktop client, which works with the Mobile Coder mobile app, to make code editing on mobile devices and syncing changes with a desktop machine
simple and intuitive.

## Installation

You can install the Mobile Coder desktop client with the command below:

```
npm install -g mobilecoder-desktop
```

## Uninstall

You can uninstall Mobile Coder desktop client with the command below:

```
npm uninstall -g mobilecoder-desktop
```

## Usage
Running `mobilecoder` or `mc` from any directory after installing will launch the Mobile Coder Desktop CLI.
```
shell> mobilecoder

OR

shell> mc

```

### Start screen

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
