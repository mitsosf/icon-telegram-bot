const mongoose = require('mongoose');
const {Schema} = mongoose;

const connectionSchema = new Schema({
    chatId: String,
    username: String,
    address: String
});

mongoose.model('connections', connectionSchema)