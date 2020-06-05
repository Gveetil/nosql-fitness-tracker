const router = require("express").Router();
const moment = require("moment");
const db = require("../models");

// Return the last workout
router.get("/", async (request, response) => {
    try {
        const result = await db.Workout.find({}, {}, { limit: 1, sort: { day: -1 } });
        return response.json(result);
    } catch (error) {
        console.log(error);
        return response.status(500).send(error.message);
    }
});

// Returns the workout summary data for the week containing the from date specified
router.get("/range/:fromDate", async (request, response) => {
    try {
        const { fromDate } = request.params;
        // Calculate week based on from date passed in - Using ISO Weeks(starting Monday) to ensure day is not locale specific 
        const weekStartDate = moment(fromDate).startOf('isoWeek').subtract(1, 'days').startOf('day');
        const weekEndDate = moment(weekStartDate).add(1, 'weeks').subtract(1, 'days').endOf('day');
        // mongodb match criteria object used to fetch records by the week
        const $match = {
            $match: {
                "day": {
                    $gte: weekStartDate.toDate(),
                    $lte: weekEndDate.toDate()
                }
            }
        };
        const weekdaySummary = await fetchSummaryByDayOfWeek($match);
        populateMissingWeekdays(weekdaySummary);
        const exerciseSummary = await fetchSummaryByExerciseName($match);
        return response.json({ weekdaySummary, exerciseSummary, weekStartDate, weekEndDate });
    } catch (error) {
        console.log(error);
        return response.status(500).send(error.message);
    }
});

// Add a new exercise to a workout 
router.put("/:id", async (request, response) => {
    try {
        const { type, name, weight, sets, reps, duration, distance } = request.body;
        let newExercise;
        if (type === "cardio") {
            newExercise = { type, name, duration, distance };
        } else if (type === "resistance") {
            newExercise = { type, name, duration, weight, reps, sets };
        } else {
            // Feature Not Implemented
            return response.status(501).send("Server does not support this exercise type!");
        }
        const result = await db.Workout.updateOne(
            { _id: request.params.id },
            { $push: { exercises: newExercise } });
        return response.json(result);
    } catch (error) {
        console.log(error);
        return response.status(500).send(error.message);
    }
});

// Create a new blank workout and return the record
router.post("/", async (request, response) => {
    try {
        const result = await db.Workout.create({
            day: new Date(Date.now()),
            exercises: []
        });
        return response.json(result);
    } catch (error) {
        console.log(error);
        return response.status(500).send(error.message);
    }
});

/**
 * Fetch Weekday Summary returns the total duration and weight for each day of the week
 * across exercises and workouts. It also restricts data to the filter criteria sent in.
 * @param {Object} $match the filter criteria used to fetch records
 * @returns {Promise} asynchronously executes database query to return a dataset 
 */
async function fetchSummaryByDayOfWeek($match) {
    const $unwind = { $unwind: "$exercises" };
    // Group by weekday and sum up duration / weight
    const $group = {
        "$group": {
            "_id": {
                "weekDay": { "$dayOfWeek": "$day" }
            },
            "duration": { "$sum": "$exercises.duration" },
            "weight": { "$sum": "$exercises.weight" }
        }
    };
    const $project = {
        $project: {
            _id: 0,
            "weekDay": "$_id.weekDay",
            duration: 1,
            weight: 1
        }
    };
    const $sort = {
        $sort: {
            "weekDay": 1
        }
    };
    return db.Workout.aggregate([$match, $unwind, $group, $project, $sort]);
}

/**
 * Fetch Exercise Summary returns the total duration and weight for each exercise type
 * across dates and workouts. It also restricts data to the filter criteria sent in.
 * @param {Object} $match the filter criteria used to fetch records
 * @returns {Promise} asynchronously executes database query to return a dataset 
 */
async function fetchSummaryByExerciseName($match) {
    const $unwind = { $unwind: "$exercises" };
    // Group by exercise name and sum up duration / weight
    const $group = {
        "$group": {
            "_id": { "exerciseName": "$exercises.name" },
            "duration": { "$sum": "$exercises.duration" },
            "weight": { "$sum": "$exercises.weight" }
        }
    };
    const $project = {
        $project: {
            _id: 0,
            "exerciseName": "$_id.exerciseName",
            duration: 1,
            weight: 1
        }
    };
    const $sort = {
        $sort: {
            "exerciseName": 1
        }
    };
    return db.Workout.aggregate([$match, $unwind, $group, $project, $sort]);
}

/**
 * This function takes in a weekday dataset and populates any missing weekdays 
 * with null data values 
 * @param {Object} dataSet the dataset to be updated
 */
function populateMissingWeekdays(dataSet) {
    if (dataSet === null) {
        return;
    }
    // Map weekdays for which data is available
    const weekdayMap = [];
    dataSet.forEach(element => {
        weekdayMap[element["weekDay"]] = true;
    });
    // Populate missing days with null values
    for (let index = 0; index < 7; index++) {
        if (!weekdayMap[index + 1]) {
            dataSet.splice(index, 0, { duration: null, weight: null, weekDay: index + 1 });
        }
    }
}

module.exports = router;