# Description
This is a simple script that will automatically download and update your minecraft bedrock server on your windows machine. It can easily be changed to target linux as well if you just update `bin-win` to `bin-linux` in the script.

## Instructions
`npm install`
`node /path/to/run.mjs /path/to/your/serverfolder`

This will replace everything in the server folder except for `server.properties`, other items to be excluded can be added to the `exclude` property in the script.