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
    num: Number
});

const Schedule = mongoose.model("Shedule", scheduleSchema);

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


app.post("/api/exercise/new-user",async (req,res)=>{
  let username = req.body.username;
  //changed up to here for the New user route.

  const newDoc = new Schedule({
    username:username
  });

  newDoc.save((err,data)=>{
    if (err) return console.error(err);
    console.log("INFO: Saved new DB doc: " + data);
    res.json({username: username, _id: data._id});
  });

});



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
