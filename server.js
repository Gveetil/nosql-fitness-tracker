const express = require("express");
const htmlRoutes = require("./routes/htmlRoutes");
const workoutRoutes = require("./routes/workoutRoutes");

// Set up port to work with Heroku as well
const PORT = process.env.PORT || 5050;

// Configure express app server
const server = express();
server.use(express.urlencoded({ extended: true }));
server.use(express.json());
server.use(express.static("public"));

// Configure routes
server.use("/api/workouts", workoutRoutes);
server.use("/", htmlRoutes);

// Start the server and listen for connections
server.listen(PORT, () => {
    console.log(`Server listening on Port: ${PORT}`);
});