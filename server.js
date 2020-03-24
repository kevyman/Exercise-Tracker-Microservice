const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose')
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true }); 

const Schema = mongoose.Schema;

const scheduleSchema = new Schema({
    username:  { type: String, required: true }, 
    count: Number,
    log: Array
});

const Schedule = mongoose.model("Schedule", scheduleSchema);

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


app.post("/api/exercise/new-user", (req,res)=>{
  const username = req.body.username;

  const newDoc = new Schedule({
    username:username,
    count:0,
    log:[]
  });

  newDoc.save((err,data)=>{
    if (err) return console.error(err);
    console.log("INFO: Saved new DB doc: " + data);
    res.json({username: username, _id: data._id});
  });

});

app.get("/api/exercise/users", (req,res)=>{
  let userArray = [];
  Schedule.find({},(err,data)=>{
    if(err){
      res.send("Something went horribly wrong: " + err);
    }else{
      data.forEach((doc)=>{
        userArray.push({_id: doc._id, username: doc.username});
      });
      res.send(userArray);
    }

  });
});

app.post("/api/exercise/add",async (req, res)=>{
  const userId = req.body.userId;
  const description = req.body.description;
  const duration = req.body.duration;
  let date = new Date();
  if(req.body.date){
    date = new Date(req.body.date);
  }

  
  let query;
  //This checks if the userId is a valid mongodb document ID or a username, and formats the search query.
  if(mongoose.Types.ObjectId.isValid(userId)){
    query = {_id:userId};
  }else{
    query = {username:userId};
  }

  let doc = await Schedule.findOne(query);

  if (doc) {
    doc.log.push({description:description,duration:duration,date:date});
    await doc.save();
    res.json({username:doc.username,_id:doc._id,description:description,duration:duration,date:date});
  }else{
    res.send("ERROR: Unknown _id or username");
  }

});

// INFO: Saved new DB doc: {
//   log: [],
//   _id: 5e789009c6c0b70a7fd54344,
//   username: 'John',
//   count: 0,
//   __v: 0
// }
// INFO: Saved new DB doc: {
//   log: [],
//   _id: 5e7a254732cace0c0569e3ff,
//   username: 'willywild',
//   count: 0,
//   __v: 0
// }

//Add exercise returns:
//{"username":"thingything","description":"kajkdfhakjd","duration":32,"_id":"ryZMKbLUI","date":"Mon Mar 23 2020"}

//https://fuschia-custard.glitch.me/api/exercise/log?userId=ryZMKbLUI returns:
//{"_id":"ryZMKbLUI","username":"thingything","count":1,"log":[{"description":"kajkdfhakjd","duration":32,"date":"Mon Mar 23 2020"}]}
//if improper id, returns: unknown userId


// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
