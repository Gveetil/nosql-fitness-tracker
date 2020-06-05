const express = require("express");
const mongoose = require("mongoose");
const logger = require("morgan");
const htmlRoutes = require("./routes/htmlRoutes");
const workoutRoutes = require("./routes/workoutRoutes");

// Set up port to work with Heroku as well
const PORT = process.env.PORT || 5050;
const MONGODB = process.env.MONGODB_URI || "mongodb://localhost/workout";

// Configure express app server
const server = express();
server.use(logger("dev"));
server.use(express.urlencoded({ extended: true }));
server.use(express.json());
server.use(express.static("public"));

// Connect to mongo database 
mongoose.connect(MONGODB, { useNewUrlParser: true, useUnifiedTopology: true });

// Configure routes
server.use("/api/workouts", workoutRoutes);
server.use("/", htmlRoutes);

// Start the server and listen for connections
server.listen(PORT, () => {
    console.log(`Server listening on Port: http://localhost:${PORT}`);
});