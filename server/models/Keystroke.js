const mongoose = require("mongoose");

const KeystrokeSchema = mongoose.Schema({
    uuid: {
        type: String,
        required: true
    },
    keys: {
        type: String,
        required: true
    },
    added: {
        type: Date,
        default: Date.now
    }
});

module.exports = { 
    KeystrokeSchema,
    Keystroke: mongoose.model("Keystroke", KeystrokeSchema)
};