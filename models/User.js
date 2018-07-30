const mongoose= require('mongoose');
const Schema=mongoose.Schema;

//create schm
const UserSchema  = new Schema({
name:{
type :String,
required:true
},
email:{
type :String,
required:true
},
password:{
    type :String,
    required:true
    },  
date:{
type:Date,
default :Date.now
}
});

mongoose.model('users',UserSchema);