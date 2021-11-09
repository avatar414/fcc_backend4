const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');
const mongoose = require('mongoose');
const validator = require('validator');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

//Get the default connection
var db = mongoose.connection;
//Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    validate(value) {
      if (!validator.isAscii(value)) {
        throw new Error('username should contain only A-Z,a-z or 0-9');
      }
    }
  },
  created: {
    type: Date,
    default: Date.now,
  }
});

const activitySchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    validate(value) {
    }
  },
  date: {
    type: Date,
    default: () => Date.now()
  },

  duration: {
    type: Number,
    required: true,
    validate(value) {
      if (!(value > 0)) {
        throw new Error('duration must be a whole number of minutes > 0');
      }
    }
  },
  description: {
    type: String,
    required: true,
    validate(value) {
    }

  },
  assocId: {
    type: String,
  }
})

const User = mongoose.model('user', userSchema);
const Activity = mongoose.model('activity', activitySchema);


app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }))



app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', async (req, res) => {
  console.log("post /api/users req.body= ", req.body);
  const username = req.body.username;

  try {
    const user = await User.create({ username: username });
    res.status(200).send({ "_id": user._id, "username": user.username });
  }
  catch (e) {
    res.status(400).send(e);
  }
});

app.get('/api/users', async (req, res) => {
  console.log("/api/users get");
  try {
    const users = await User.find({}, '_id username');
    res.status(200).send(users);
  }
  catch (e) {
    res.status(400).send(e);
  }

});

app.post('/api/users/:_id/exercises', async (req, res) => {
  console.log("post /api/users/:_id/exercises req.body= ", req.body);
  console.log("post /api/users/:_id/exercises req.params= ", req.params);
  try {

    const usr = await User.findById({ _id: req.params._id }, 'username',)
    if (!usr)
      return res.status(404).send({ error: "Invalid Username" })
    const uname = usr.username;
    const uid = req.params._id;

    console.log("Req.body.date: ", req.body.date);
    if (req.body.date === "") {
      theDate = new Date(Date.now());
      console.log(theDate)
    } else {
      console.log("false");
      theDate = new Date(Date.parse(req.body.date));
    }

    //const theDate = new Date(Date.now());   
    const activity = await Activity.create(
      {
        username: uname,
        assocId: req.params._id,
        description: req.body.description,
        duration: req.body.duration,
        date: theDate
      });
    res.status(200).send({
      _id: uid,
      username: uname,
      description: activity.description,
      duration: activity.duration,
      date: activity.date.toDateString()
    });
  }
  catch (e) {
    res.status(400).send(e);
  }
});

app.get('/api/users/:_id/logs', async (req, res) => {
  console.log("post /api/users/:_id/logs req.body= ", req.body);
  console.log("post /api/users/:_id/logs req.params= ", req.params);
  try {
    const user = await User.findById({ _id: req.params._id }, 'username',)
    if (!user)
      return res.status(404).send({ error: "Invalid User" })
    const uname = user.username;
    const uid = req.params._id;
    const activities = await Activity.find({ assocId: uid }, 'description duration date')
    factivities= []
    activities.forEach((element) => {factivities.push({
      _id : element._id,
      duration : element.duration,
      description : element.description,
      date : element.date.toDateString()
    })})
    res.status(201).send({
      username: uname,
      count: activities.length,
      _id: uid,
      log: factivities
      
    });
  }
  catch (e) {
    res.status(400).send(e);
  }
});






const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
