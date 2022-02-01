const bcrypt = require("bcryptjs");
var randomstring = require("randomstring");
const jsonwebtoken = require("jsonwebtoken");
const db = require('../models');
const EmailFunction = require("../lib/email-functions");
const { emailTemplates } = require("../lib/constants");
const User = db.user;

exports.signup = (req, res) => {
    const { email, username, mobile, role, password } = req.body;
    const user = new User({
        username: username,
        authType: 'password',
        email: {
            address: email,
            verified: false
        },
        mobile: mobile,
        password: bcrypt.hashSync(password, 8),
        role: role
    });
    user.save((err, user) => {
        if (err) {
            res.status(500).send({ message: err });
            return;
        } 
        if(user){
            const token = randomstring.generate(70);;
            user.tokens.email = {
                token,
                when: new Date()
            };
            user.save();
            const emailHtml = EmailFunction.populateTemplate(emailTemplates.emailVerification,{
                siteLink: "http://localhost:3000/",
                verificationLink: `http://localhost:3000/${token}`
            })
            EmailFunction.sendEmail(
                email,
                "Verification Email",
                emailHtml
            )
            res.send({ message: "User was registered successfully!" });
        }
    })
}

exports.registerOAuthUser = (req,res) => {
    const { email, username, mobile, role, type } = req.body;
    User.findOne({'email.address':email},async function(err,user){
        if (err) {
            res.status(500).send({ message: err });
            return;
        } 
        if(!user){
            const newUser = new User({
                username: username,
                authType: type,
                email: {
                    address: email,
                    verified: true
                },
                mobile: mobile,
                role: role
            });
            const insertedData = await newUser.save();
            const token = jsonwebtoken.sign({ id: insertedData._id }, process.env.JWT_SECRET, {
                expiresIn: 86400
            })
            res.status(200).send({
                id: insertedData._id,
                username: insertedData.username,
                email: insertedData.email,
                mobile: insertedData.mobile,
                role: insertedData.role,
                accessToken: token
            });
        } else {
            const token = jsonwebtoken.sign({ id: user._id }, process.env.JWT_SECRET, {
                expiresIn: 86400
            })
            res.status(200).send({
                id: user._id,
                username: user.username,
                email: user.email,
                mobile: user.mobile,
                role: user.role,
                accessToken: token
            });
        }
    })
}

exports.signin = (req, res) => {
    User.findOne({
        'email.address': req.body.email
    }, function (err, user) {
        if (err) {
            res.status(500).send({ message: err });
            return;
        }
        if (!user) {
            return res.status(404).send({ message: "User Not found!" });
        }
        if(user.authType !== 'password'){
            res.status(404).send({
                message: `User is registered with external service!`
            });
            return;
        }
        if(!user.email.verified){
            return res.status(404).send({ message: "Email not verified!" });
        }
        var passwordIsValid = bcrypt.compareSync(
            req.body.password,
            user.password
        );
        if (!passwordIsValid) {
            return res.status(401).send({
                accessToken: null,
                message: "Invalid Password!"
            });
        }
        const token = jsonwebtoken.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: 86400
        })
        res.status(200).send({
            id: user._id,
            username: user.username,
            email: user.email,
            mobile: user.mobile,
            role: user.role,
            accessToken: token
        });
    })
}

exports.forgotPassword = (req,res) => {
    const {email} = req.body;
    if(!email){
        res.status(500).send({ message: 'Please provide email!' });
        return;
    }
    User.findOne({
        'email.address':email
    },function(err,user){
        if (err) {
            res.status(500).send({ message: err });
            return;
        }
        if (!user) {
            res.status(404).send({
                message: "User not found with this email!"
            });
            return;
        }
        if(user.authType !== 'password'){
            res.status(404).send({
                message: `Unable to send reset link, as user is registered with external service!`
            });
            return;
        }
        const token = randomstring.generate(90);;
        user.tokens.password = {
            token,
            when: new Date()
        };
        user.save();
        const emailHtml = EmailFunction.populateTemplate(emailTemplates.emailVerification,{
            siteLink: "http://localhost:3000/",
            verificationLink: `http://localhost:3000/${token}`
        })
        EmailFunction.sendEmail(
            email,
            "Reset password link",
            emailHtml
        )
        res.send({ message: "Reset link sent successfully!" });
    })
}

exports.resetPassword = (req,res) => {
    const {password,token} = req.body;
    User.findOne({'tokens.password.token':token},function(err,user){
        if (err) {
            res.status(500).send({ message: err });
            return;
        }
        if (!user) {
            res.status(404).send({
                message: "Invalid token"
            });
            return;
        }
        if(!password){
            res.status(500).send({
                message: "Please provide password!"
            });
        }
        user.tokens.password = undefined;
        user.password = bcrypt.hashSync(password, 8);
        user.save();
        res.status(200).send({
            message: "Password reset successfully!"
        });

    })
}

exports.verifyEmail = (req,res) => {
    User.findOne({
        'tokens.email.token': req.body.token
    }, function (err, user) {
        if (err) {
            res.status(500).send({ message: err });
            return;
        }
        if (!user) {
            return res.status(404).send({
                verified : false,
                message: "Invalid token!"
            });
        }
        user.tokens.email = undefined;
        user.email.verified = true;
        user.save();
        res.status(200).send({
            verified : true,
            message: "Successfully verified!"
        });
    })
}

exports.changePassword = (req,res) => {
    const {userId} = req;
    const {oldPassword,newPassword} = req.body;
    if(!userId){
        res.status(500).send({ message: "User Id not found" });
        return;
    }
    User.findOne({_id:userId},function(err,user){
        if (err) {
            res.status(500).send({ message: err });
            return;
        }
        if (!user) {
            return res.status(404).send({
                message: "User not found!"
            });
        }
        if(user.authType !== 'password'){
            res.status(404).send({
                message: `Unable to reset password, as user is registered with external service!`
            });
            return;
        }
        if(!oldPassword){
            return res.status(500).send({
                message: "Please provide old password!"
            });
        }
        const checkOldPassword = bcrypt.compareSync(
            oldPassword,
            user.password
        );
        if(!checkOldPassword){
            return res.status(401).send({
                message: "Invalid Password!"
            });
        }
        if(!newPassword){
            return res.status(500).send({
                message: "Please provide new password!"
            });
        }
        user.password = bcrypt.hashSync(newPassword, 8);
        user.save();
        res.status(200).send({
            verified : true,
            message: "Password updated successfully!"
        });
    })
}