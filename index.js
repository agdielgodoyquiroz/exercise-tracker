const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

// Schemas
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  }
});

const exerciseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  description: String,
  duration: Number,
  date: Date
});

// Models
const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', exerciseSchema);

// Create user
app.post('/api/users', async (req, res) => {

  try {

    const user = new User({
      username: req.body.username
    });

    const savedUser = await user.save();

    res.json({
      username: savedUser.username,
      _id: savedUser._id
    });

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }

});

// Get all users
app.get('/api/users', async (req, res) => {

  try {

    const users = await User.find({});

    res.json(users);

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }

});

// Add exercise
app.post('/api/users/:_id/exercises', async (req, res) => {

  try {

    const user = await User.findById(req.params._id);

    if (!user) {
      return res.json({
        error: 'User not found'
      });
    }

    const exercise = new Exercise({
      userId: user._id,
      description: req.body.description,
      duration: Number(req.body.duration),
      date: req.body.date
        ? new Date(req.body.date)
        : new Date()
    });

    const savedExercise = await exercise.save();

    res.json({
      _id: user._id,
      username: user.username,
      description: savedExercise.description,
      duration: savedExercise.duration,
      date: savedExercise.date.toDateString()
    });

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }

});

// Get logs
app.get('/api/users/:_id/logs', async (req, res) => {

  try {

    const user = await User.findById(req.params._id);

    if (!user) {
      return res.json({
        error: 'User not found'
      });
    }

    let filter = {
      userId: req.params._id
    };

    if (req.query.from || req.query.to) {
      filter.date = {};
    }

    if (req.query.from) {
      filter.date.$gte = new Date(req.query.from);
    }

    if (req.query.to) {
      filter.date.$lte = new Date(req.query.to);
    }

    let query = Exercise.find(filter);

    if (req.query.limit) {
      query = query.limit(Number(req.query.limit));
    }

    const exercises = await query;

    const log = exercises.map(exercise => ({
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString()
    }));

    res.json({
      username: user.username,
      count: log.length,
      _id: user._id,
      log
    });

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }

});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log(
    'Your app is listening on port ' + listener.address().port
  );
});