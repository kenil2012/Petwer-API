const mongoose = require("mongoose");

const User = mongoose.model(
  "User",
  new mongoose.Schema({
    username: String,
    authType: String,
    tokens: {
      email: {
        token: String,
        when: Date
      },
      password: {
        token: String,
        when: Date
      }
    },
    email: {
      address: String,
      verified: Boolean
    },
    mobile: String,
    password: String,
    role: String
  })
);

module.exports = User;