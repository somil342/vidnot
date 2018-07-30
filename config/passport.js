const LocalStategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

//load model
require('../models/User');
const User = mongoose.model('users');


module.exports = function (passport) {
    passport.use(new LocalStategy({ usernameField: 'email' }, (email, password, done) => {
        // matcing usr
        User.findOne({
            email: email
        })
            .then(user => {
                if (!user) {
                    return done(null, false, { message: 'No User Found' }); //(error,usr-since no user thefre false,message)
                }
                // maatching password
                bcrypt.compare(password, user.password, (err, isMatch) => {
                    if (err) throw err;
                    if (isMatch) {
                        return done(null, user,{message:'Logged in successfully'});
                    } else {
                        return done(null, false, { message: 'Passwrd incorrect' })
                    }
                })
            })
    }));


    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function (id, done) {
        User.findById(id, function (err, user) {
            done(err, user);
        });
    });

}