const express = require("express");
const app = express();
const bodyParser = require("body-parser");

const cors = require("cors");

const mongoose = require("mongoose");
const User = require("./models/Models");
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
// || 'mongodb://localhost/exercise-track'
app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.post("/api/exercise/new-user", (req, res) => {
  const newUser = new User({ username: req.body.username });
  newUser.save().then(res.json(newUser));
});

app.post("/api/exercise/add", (req, res) => {
  const newLog = {
    description: req.body.description,
    duration: req.body.duration,
    date: req.body.date
  };
  if (!newLog.date) delete newLog.date;
  User.findOneAndUpdate(
    { _id: req.body.userId },
    { $push: { log: newLog } },
    { useFindAndModify: false },
    (err, data) => {
      if (err) {
        return console.log(err);
      } else {
        res.json({
          username: data.username,
          description: req.body.description,
          duration: req.body.duration,
          _id: req.body.userId,
          date: req.body.date ? req.body.date : new Date()
        });
      }
    }
  );
});

app.get("/api/exercise/users", (req, res) => {
  User.find({}, (err, data) => {
    if (err) {
      return console.log(err);
    } else {
      res.json(data);
    }
  });
});

app.get("/api/exercise/log", (req, res) => {
  if (!req.query.username) {
    res.json({ error: "Username missing" });
  } else {
    User.find({ username: req.query.username }, (err, data) => {
      if (err) {
        return console.log(err);
      } else {
        let filteredLog = data[0].log.slice();
        if (req.query.limit) {
          filteredLog = filteredLog.slice(0, req.query.limit);
        }
        if (req.query.from) {
          filteredLog = filteredLog.filter(
            exercise => exercise.date > req.query.from
          );
        }
        if (req.query.to) {
          filteredLog = filteredLog.filter(
            exercise => exercise.date < req.query.to
          );
        }
        const count = filteredLog.length;
        res.json({ _id: data[0]._id, username: req.query.username, count: count, log: filteredLog });
      }
    });
  }
});

// Not found middleware
app.use((req, res, next) => {
  return next({ status: 404, message: "not found" });
});

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage;

  if (err.errors) {
    // mongoose validation error
    errCode = 400; // bad request
    const keys = Object.keys(err.errors);
    // report the first validation error
    errMessage = err.errors[keys[0]].message;
  } else {
    // generic or custom error
    errCode = err.status || 500;
    errMessage = err.message || "Internal Server Error";
  }
  res
    .status(errCode)
    .type("txt")
    .send(errMessage);
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
