require('dotenv').config()
// console.log(process.env.SECRET) 
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const path = require("path");
// const encrypt = require("mongoose-encryption");  //encrypt on save() and decrypt on find()
const md5 = require("md5"); 
const bcrypt = require("bcrypt");
const saltRounds = 10;

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect("mongodb://localhost:27017/levleOneDB", {
  useNewUrlParser: true,
});

const k =556
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});

// const secretKey =process.env.SECRET 
// userSchema.plugin(encrypt,{secret:secretKey,encryptedFields:['password']}); // here we have applied the encryption on password field

const User = new mongoose.model("User", userSchema);

app.get("/", function (req, res) {
  res.render("home");
});

app.get("/login", function (req, res) {
 
  res.render("login");

});

app.get("/register", function (req, res) {
  res.render("register");
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
  bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
    const newUser = new User({
      email: req.body.username,
      password: hash,
    });

    newUser.save().then(function (data, err) {
      if (err) {
        console.log(err);
      } else {
        console.log("User Created");
        res.render("secrets");
      }
    });
  });

});

app.post('/login',function(req,res){
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
  const emaIL = req.body.username
  const pass= req.body.password
  User.findOne({email:emaIL}).then(function(data,err){
      
      if(err){
        console.log(err);
      }
      else{
    const actPass =data
    bcrypt.compare(pass, actPass.password, function(err, result) {
      if (result == true) {
        res.render('secrets')
      }
      else{
        console.log('password : '+ pass + ' Actual password : '+data.password);

        
      }
    });
  }


});
});

app.listen(3000, () => {
  console.log("Server started on Port 3000");
});
