const router = require("express").Router();
var path = require('path');

// exercise route
router.get("/exercise", (request, response) => {
    return response.sendFile(path.join(__dirname, "../public/exercise.html"));
});

// stats route
router.get("/stats", (request, response) => {
    return response.sendFile(path.join(__dirname, "../public/stats.html"));
});

// For all other routes, redirect to the home page by default
router.get("*", (request, response) => {
    return response.redirect("/");
});

module.exports = router;