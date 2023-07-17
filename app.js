//jshint esversion:6
require("dotenv").config();
// console.log(process.env.SECRET)
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const path = require("path");
// const encrypt = require("mongoose-encryption");  //encrypt on save() and decrypt on find()
// const md5 = require("md5");
// const bcrypt = require("bcrypt");
// const saltRounds = 10;
const session = require("express-session"); //level-5
const passport = require("passport"); //level-5
const passportLocalMongoose = require("passport-local-mongoose"); //level-5
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate"); //level-6
const { rmSync } = require("fs");

// level 5 security requires (cookies and sessions):
//passport passport-local passport-local-mongoose express-session

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  session({
    //level-5
    secret: "IKnowWhatYouDidLastNight",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize()); //level-5
app.use(passport.session()); //level-5

mongoose.connect("mongodb://localhost:27017/levleOneDB", {
  useNewUrlParser: true,
});

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  googleId: String //level-6
});

userSchema.plugin(passportLocalMongoose); //level-5
userSchema.plugin(findOrCreate); //level-6

// const secretKey =process.env.SECRET
// userSchema.plugin(encrypt,{secret:secretKey,encryptedFields:['password']}); // here we have applied the encryption on password field

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy()); //level-5
// passport.serializeUser(User.serializeUser()); //level-5
// passport.deserializeUser(User.deserializeUser()); //level-5

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id).then(function(err, user) {
    done(err, user);
  });
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/secrets",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
    },
    function (accessToken, refreshToken, profile, cb) {
      // console.log(profile);
      User.findOrCreate({ googleId: profile.id }, function (user,err ) {
        console.log("ok",err);
        return cb(user);
      });
    }
  )
); //level-6

app.get("/", function (req, res) {
  res.render("home");
});

app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] })
);

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),

  function(req, res) {
    console.log('yo');
    // Successful authentication, redirect home.
    res.redirect('/secrets');  
      // res.render('secrets');

  });



app.get("/login", function (req, res) {
  res.render("login");
});

app.get("/register", function (req, res) {
  res.render("register");
});

app.get("/secrets", function (req, res) {
  console.log('line 116');
  if (req.isAuthenticated()) {
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
  // User.find({"secret": {$ne: null}}, function( foundUsers,err){
  //   if (err){
  //     console.log(err); 
  //   } else {
  //     if (foundUsers) {
  //       res.render("secrets", {usersWithSecrets: foundUsers});
  //     }
  //   }
  // });
});

app.get("/logout", function (req, res) {
  req.logout(function (err) {
    if (err) {
      console.log("line 121"+err);
    } else {
      res.redirect("/");
    }
  });
});

app.post("/register", function (req, res) {
  //md5 encryption
  // const newUser = new User({
  //   email: req.body.username,
  //   password: md5(req.body.password)
  // });

  // newUser.save().then(function (data, err) {
  //   if (err) {
  //     console.log(err);
  //   } else {
  //     console.log("User Created");
  //     res.render("secrets");
  //   }
  // });

  //bcrypt encryption
  // bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
  //   const newUser = new User({
  //     email: req.body.username,
  //     password: hash,
  //   });

  //   newUser.save().then(function (data, err) {
  //     if (err) {
  //       console.log(err);
  //     } else {
  //       console.log("User Created");
  //       res.render("secrets");
  //     }
  //   });
  // });

  //level-5

  User.register(
    { username: req.body.username },
    req.body.password,
    function (err, user) {
      if (err) {
        console.log("line 168"+err);
        res.redirect("/register");
      } else {
        console.log("yo");
        console.log(user);
        passport.authenticate("local")(req, res, function () {
          res.redirect("/secrets");
        });
      }
    }
  );
});

app.post("/login", function (req, res) {
  //md5 encryption
  // const emaIL = req.body.username
  // const pass= md5(req.body.password)
  // User.findOne({email:emaIL}).then(function(data,err){

  //   if(err){
  //     console.log(err);
  //   }
  //   else{
  // const actPass =data
  // if(pass === data.password){
  //   console.log('Match found!');
  //   res.render('secrets')
  // }
  // else{
  //   console.log('password : '+ pass + ' Actual password : '+data.password);
  // }

  //   }
  // });

  //bcrypt encryption
  // const emaIL = req.body.username
  // const pass= req.body.password
  // User.findOne({email:emaIL}).then(function(data,err){

  //     if(err){
  //       console.log(err);
  //     }
  //     else{
  //   const actPass =data
  //   bcrypt.compare(pass, actPass.password, function(err, result) {
  //     if (result == true) {
  //       res.render('secrets')
  //     }
  //     else{
  //       console.log('password : '+ pass + ' Actual password : '+data.password);

  //     }
  //   });
  // }

  // });

  //level-5
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });

  req.login(user, function (err) {
    if (err) {
      console.log("line 233"+err);
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/secrets");
      });
    }
  });
});

app.listen(3000, () => {
  console.log("Server started on Port 3000");
});
