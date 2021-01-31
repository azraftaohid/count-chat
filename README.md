# count-chat
Counts the number of messages in Facebook Messenger (Offline)

## Install and Use
### Prerequisite
An archive of your Facebook messages. You can request one from [facebook](https://www.facebook.com/dyi).
### Prepare
 - Extract the archive at [resources](./src/resources)
 - Modify `root` variable at [index](./src/index.ts) to match your extracted folder name
 - Pass your desired person's name to `countMessages` function
### Build and Run
 - First install the dependencies by running `npm install` from terminal
 - Then run `npm run-script build` to build the project
 - And run `npm run-script start` to execute

## License
All files on the count-chat Github repository are subject to the MIT License. Please read the [LICENSE](./LICENSE) file at the root of the project.