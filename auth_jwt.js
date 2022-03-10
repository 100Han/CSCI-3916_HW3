// Load required packages
require('dotenv').config();
var passport = require('passport');
var JwtStrategy = require('passport-jwt').Strategy;
var ExtractJwt = require('passport-jwt').ExtractJwt;
const {authModel, movieModel}=require('./model');

var opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme("jwt");
opts.secretOrKey = process.env.SECRET_KEY;

// authentication jwt strategy implementation
passport.use(new JwtStrategy(opts, function(jwt_payload, done) {
       authModel.findOne({username: jwt_payload.username},
        (err,user)=>
        {
          if(!err)
          {
            
            if (user) {
              done(null, user);
         }
          else {
           done(null, false);
         }

          }
          else{
            done(null, false);
          }
        });  
}));

exports.isAuthenticated = passport.authenticate('jwt', { session : false });
exports.secret = opts.secretOrKey ;