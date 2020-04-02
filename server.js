const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const assert = require("assert");
const fetch = require("node-fetch");
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

const x = {
  username: "username",
  description: "test",
  duration: 60,
  _id: "_id",
  date: "Mon Jan 01 1990"
};
const y = {
  username: "username",
  description: "test",
  duration: 60,
  _id: "_id",
  date: "Mon Jan 01 1990"
};

assert.deepEqual(x, y);

app.post("/api/exercise/new-user", (req, res) => {
  const newUser = new User({ username: req.body.username });
  newUser.save().then(res.json(newUser));
});

app.post("/api/exercise/add", function(req, res) {
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
    function(err, data) {
      if (err) {
        return console.log(err);
      } else {
        res.json({
          username: data.username,
          description: req.body.description,
          duration: parseInt(req.body.duration),
          _id: req.body.userId,
          date: req.body.date
            ? new Date(req.body.date).toDateString()
            : new Date().toDateString()
        });
        // res.json(data)
      }
    }
  );
});

// const logExercise = (req, res) => {
//   User.findOneAndUpdate(
//     { _id: req.body.id },
//     { useFindAndModify: false },
//     {
//       $push: { log: req.body },
//       $inc: { count: 1 }
//     },
//     (err, docs) => {
//       if (err) {
//         return console.log(err);
//       } else {
//         res.json(docs);
//       }
//     }
//   );
// };
// app.post("/api/exercise/add", logExercise);

app.get("/api/exercise/users", function(req, res) {
  User.find({}, (err, data) => {
    if (err) {
      return console.log(err);
    } else {
      res.json(data);
    }
  });
});

app.get("/api/exercise/log", function(req, res) {
  if (!req.query.userId) {
    res.json({ error: "UserId missing" });
  } else {
    User.find({ _id: req.query.userId }, function(err, data) {
      if (err) {
        return console.log(err);
      } else {
        let filteredLog = data[0].log.slice();
        if (req.query.limit) {
          filteredLog = filteredLog.slice(0, req.query.limit);
        }
        if (req.query.from) {
          console.log(filteredLog, req.query.from);
          filteredLog = filteredLog.filter(exercise =>
             exercise.date.toISOString() > req.query.from
          );
        }
        if (req.query.to) {
          filteredLog = filteredLog.filter(
            exercise => exercise.date.toISOString() < req.query.to
          );
        }
        const count = filteredLog.length;
        res.json({
          _id: data[0]._id,
          username: req.query.username,
          count: count,
          log: filteredLog
        });
      }
    });
  }
});

// function getUserInput(){
//    fetch('https://rimantas-exercise-tracker.glitch.me/api/exercise/users')
//   .then((response) => {
//     return response.json();
//   })
//   .then((data) => {
//     assert.isArray(data);
//   });

// if (res.ok) {
//   const data =  res.json();
//   assert.isArray(data);
// } else {
//   throw new Error(`${res.status} ${res.statusText}`);
// }
// }

// getUserInput();

// app.get("/test", (req, res) => {
//       const url = getUserInput('https://rimantas-exercise-tracker.glitch.me');
//       const result = fetch(url + '/api/exercise/users');

//       if (res.ok) {
//         const data = await res.json();
//         assert.isArray(data);
//       } else {
//         throw new Error(`${res.status} ${res.statusText}`);
//       }
// })

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
