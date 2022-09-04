const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
var bodyParser = require("body-parser");
var mongoose = require('mongoose');
const { raw } = require('body-parser');
const mongoUrl = process.env['MONGO_URI'];

mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())
// routes
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// Databases
const ExerciseSchema = new mongoose.Schema({
  userId: {type:String , required: true},
  description: {type:String , required:true},
  duration : {type: Number, required:true},
  date: Date,
})

const UserSchema = new mongoose.Schema({
  username: {type:String, required: true},
})

const Exercise = mongoose.model('Exercise', ExerciseSchema);
const User = mongoose.model('User', UserSchema);

app.get('/api/users', (req,res)=>{
  User.find((err,data)=>{
    res.json(data)
  })
})

app.post('/api/users', (req,res)=>{
 newUser = req.body.username;

  User.create({username: newUser}, function (err, data) {
    if (err) return res.json(err);
    else{
      res.json(data);
      return console.log("user Created!");
    } 
    })
})

app.post('/api/users/:id/exercises', (req,res) =>{
    const id = req.params.id;
    let {description, duration, date } = req.body;

    User.findById( id, (err, userData) =>{
      if (err || !userData){
        console.log(err);
        res.send("Could not find user")
      } else {
        if(date == ""){
          date = new Date();
          }
          
          const newExercise =  new Exercise({ userId:id, description,duration, date:new Date(date)})
          newExercise.save((err,data)=>{
            if(err || !data){
              res.send("there was an error saving this exercise")
            } else {
              const {description,duration, date, _id} = data;
              res.json({
                username: userData.username,
                description,
                duration,
                date: date.toDateString(),
                _id: userData.id
              })
            }
          })
      }
    })
})

app.get('/api/users/:id/logs' , (req,res)=>{
  const { from, to, limit} = req.query;
  const {id} = req.params;

  User.findById(id, (err,userData)=>{
      if(err || !userData){
        res.send("Could not find user")
      } else {
        let dateObj = {}

        if(from){
          dateObj["$gte"] = new Date(from)
        }

        if(to){
          dateObj["$lte"] = new Date(to)
        }

        let filter = {userId : id}
        if(from || to){
          filter.date = dateObj
        }
        let nonNullLimit = limit ?? 500
        Exercise.find(filter).limit(+nonNullLimit).exec((err,data)=>{
          if (err|| !data){
            res.json(err)
          }
          else{
            const count = data.length
            const rawLog = data
            const {username, _id} = userData;
            const log = rawLog.map((l)=>({
              description: l.description,
              duration: l.duration,
              date: l.date.toDateString()
            }))
          
            res.json({username, count,_id, log})
          }
        })
      }
  })
})

//listen
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})


