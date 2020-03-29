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
    doc.count+=1;
    await doc.save();
    res.json({username:doc.username,_id:doc._id,description:description,duration:duration,date:date.toDateString()});
  }else{
    res.send("ERROR: Unknown _id or username");
  }

});

app.get("/api/exercise/log", async (req,res)=>{
  //http://127.0.0.1:3000/api/exercise/log?userId=John&from=2020-03-1&to=2020-12-1&limit=2

  let userId, from, to, limit;
  ({userId, from, to, limit} = req.query);

  console.log(`${userId} - ${from} - ${to} - ${limit}`);
  let fromDate = new Date(0);
  let toDate = new Date();

  if(!limit || isNaN(limit)){
    limit = 99;
  }
  if(from){
    fromDate = new Date(from);
  }
  if(to){
    toDate = new Date(to);
  }

  console.log(`${userId} - ${fromDate.toDateString()} - ${toDate.toDateString()} - ${limit}`);

  if(userId && fromDate.isValid() && toDate.isValid() && fromDate < toDate){
    console.log("Success!");

    let query;
    //This checks if the userId is a valid mongodb document ID or a username, and formats the search query.
    if(mongoose.Types.ObjectId.isValid(userId)){
      query = {_id:userId};
    }else{
      query = {username:userId};
    }

    console.log(query);
    
    const userDoc = await Schedule.findOne(query); 

    

    if(userDoc){
      let filteredArray = [];
      limitCounter = 0;

      userDoc.log.forEach(exercise =>{
        if(exercise.date>=fromDate && exercise.date<=toDate && limitCounter<limit){
          filteredArray.push(exercise);
          limitCounter++;
        }
      });
      userDoc.log = filteredArray; 
      res.send(userDoc);

    }else{
      res.send("Sorry, no logs found.");
    }
  }else{
    res.send("ERROR: Invalid userId or dates.");
  }
 
  
});




Date.prototype.isValid = function () { 
              
  // If the date object is invalid it 
  // will return 'NaN' on getTime()  
  // and NaN is never equal to itself. 
  return this.getTime() === this.getTime(); 
}; 

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
