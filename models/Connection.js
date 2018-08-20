const mongoose = require('mongoose');
const {Schema} = mongoose;

const connectionSchema = new Schema({
    chatId: String,
    address: String,
    lastBalance: String
});

mongoose.model('connections', connectionSchema)