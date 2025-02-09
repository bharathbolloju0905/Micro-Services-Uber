const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    captain: {
        type: mongoose.Schema.Types.ObjectId,
       
    },
    source: {
        type: String,
        required: true
    },
    destination:{
        type:String,
        required:true
    },
    status:{
        type:String ,
        enum:["requested","accepted","started","ended","rejected"],
        default:"requested"
    }
})
module.exports = mongoose.model('User', UserSchema);