# Twenty-Twenty-RAT
Remote Access Trojan (RAT) made using NodeJS, ExpressJS, Socket. IO, Python, and HTML Web Components.

## Libraries/Packages used
This project uses the following open source libraries/packages:

**Server**  - NodeJS(Javascript) v12.16.3
* autoprefixer
* dotenv
* express
* mongoose
* postcss
* postcss-cli
* socket. io
* tailwindcss

**Client** - Python 3.8.3
* opencv-python
* pynput
* python-socketio
* updog
* pygame

## Prerequisites before running
* Install NodeJS v12.16.3 or higher on the server
* Install Python 3.8.3 or higher on server if the game and RAT will be packaged with the python interpreter into an executable
**or**
Install Python 3.8.3 or higher on the client.
* Create a new MongoDB Atlas project and cluster.

### Edit config files
**Server**
1) Create file "`.env`" in `server` folder and enter MongoDB connection URL
`DB_CONNECTION=YOUR_CONNECTION URL_HERE`
*Optional*
Add the following with a port number to change the default port number, 3000
`Port=PORT_NUMBER`

**Client**
1) Edit  `config.py`  file in the  `client`  folder with the server IP address and port.  
    `SERVER = SERVER_IP_ADDRESS PORT = PORT_NUMBER`  


### Install project dependencies
**Server**
1) Navigate the `server` folder in project using Terminal/Windows Command Prompt.
2) Run the following command to install required packages(listed in package.json) to run the server:
`npm install`

**Client**
1) Copy `client` folder to client machine and navigate to it using Terminal/Windows Command Prompt. 
2) Run the following command to install required packages(listed in requirements.txt) to run the server:
`pip install -r requirements.txt`
3) ~~Generate executable~~


## Run
An working executable was unable to be generated for the game and RAT, so the running instruction shows how to run from the script.
1) Start server using command
`npm run start`
>**Note**: This command will generate css for the web interface for viewing clients and then starts the server, subsequent starts can be run with
> `node index.js`
2) After the server connects to be MongoDB, clients can then connect.
Since a working executable could not generated during my testing, the RAT on the client machine can be started using 
`python app.py`
3) Each newly connected client will be added to the MongoDB database in the collection `"victim"`.

## Usage
1) With the server running, in a web browser, navigate to the server's ip address and port number
`ipAddress:port`
2) On the left, all clients from the database will be listed. Clicking on `Select`, more information about the client and options to view the client's web camera, file directory, and saved keystrokes will be showned.
> **Note**: If the server is unavailable or offline, the client's keystrokes will be saved in a binary file and then be uploaded and saved to the database when the server becomes available

### File directory
Selecting the `File directory` option will open an `iframe` element on the web page after a few seconds
>**Note**: If the iframe fails to load, try right clicking on it and select 
`reload iframe`

The file directory of the client's Windows installation drive(typically, "C:") can be browsed.
Files can also to uploaded to the client's machine.

### Web camera
Selecting the `Web camera` option will open an `img` element on the web page after a few seconds.
A live feed of client's web camera will be visible.

>**Note**:  Closing the webpage or switching options will turn off the client's web camera


### Keystrokes
Selecting the `Keystrokes` option will open a `table` element on the web page after a few seconds.
All stored and new keystrokes will be visible.


## Todo
* Package game in executable
* Package RAT in executable
* Make RAT cross-platform
