// User Model/Schema

const {Schema, model, Types} = require("mongoose")

const userSchema = new Schema({
  username: {
    type: String,
    trim: true,
    required: [true, 'Username is required.'],
    unique: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required.'],
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address.'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required.'],
  },
  tweet: [{
    type: Types.ObjectId,
    ref: "Tweet"
  }]
},
{timestamp: true,}
)

module.exports = model("User",userSchema)
