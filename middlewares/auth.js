const jsonwebtoken = require('jsonwebtoken');
const db = require('../models');
const User = db.user;
const checkUserExisting = (req,res,next) => {
    User.findOne({
        'email.address': req.body.email
    },function(err,user){
        if(err){
            res.status(500).send({ message: err });
            return;
        } 
        if(user) {
            res.status(400).send({ message: "Failed! Email is already in use!" });
            return;
        }
        next();
    })
}

const verifyToken = (req, res, next) => {
    const token = req.headers["x-access-token"];
    if (!token) {
      return res.status(403).send({ message: "No token provided!" });
    }
  
    jsonwebtoken.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).send({ message: "Unauthorized!" });
      }
      req.userId = decoded.id;
      next();
    });
  };

  const verifyOauthUser = (req, res, next) => {
    const {email,type} = req.body;
    User.findOne({'email.address':email,authType:{$ne:type}},function(err,user){
      if(err){
        res.status(500).send({ message: err });
        return;
      } 
      if(user) {
        res.status(400).send({ message: "Email is already registered with another service!" });
        return;
      }
      next();
    })
  }

module.exports = {
    checkUserExisting,
    verifyToken,
    verifyOauthUser
}