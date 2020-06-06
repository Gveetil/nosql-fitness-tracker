const router = require("express").Router();
const moment = require("moment");
const db = require("../models");

// This path returns the workout summary data for the charts on the stats page 
// The data returned is specific to the week containing the from date provided
router.get("/range/:fromDate", async (request, response) => {
    try {
        const { fromDate } = request.params;
        // Calculate week based on from date passed in - Using ISO Weeks(starting Monday) to ensure day is not locale specific 
        const weekStartDate = moment(fromDate).startOf('isoWeek').subtract(1, 'days').startOf('day');
        const weekEndDate = moment(weekStartDate).add(1, 'weeks').subtract(1, 'days').endOf('day');
        // mongodb match criteria object used to fetch records specific to the week
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

// This path returns the last workout entered in the system
router.get("/", async (request, response) => {
    try {
        const result = await db.Workout
            .find({})
            .sort({ _id: -1 })
            .limit(1)
            .exec();
        return response.json(result);
    } catch (error) {
        console.log(error);
        return response.status(500).send(error.message);
    }
});

// This path returns the previous / next workout based on date and current workout id (if available) 
// the operation types supported are: P - previous, N - next 
router.get("/:workoutDate/:operation/:workoutId?", async (request, response) => {
    try {
        const { workoutId, workoutDate, operation } = request.params;
        let $filter, $sort;
        if (operation === "P") {
            $filter = fetchPreviousFilter(workoutDate, workoutId);
            // Sort order to get the last record from the filtered set
            $sort = { _id: -1 };
        } else if (operation === "N") {
            $filter = fetchNextFilter(workoutDate, workoutId);
            // Sort order to get the first record from the filtered set
            $sort = { _id: 1 };
        } else {
            // Feature Not Implemented
            return response.status(501).send("Server does not support this option!");
        }
        console.log($filter);
        const result = await db.Workout
            .find($filter)
            .sort($sort)
            .limit(1)
            .exec();
        return response.json(result);
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
            { $push: { exercises: newExercise } }, { runValidators: true });
        return response.json(result);
    } catch (error) {
        if (error.name == 'ValidationError') {
            return response.status(422).json(error.errors["exercises"].message);
        }
        console.log(error);
        return response.status(500).send(error.message);
    }
});

// Delete the selected workout 
router.delete("/:id", async (request, response) => {
    try {
        const result = await db.Workout.deleteOne(
            { _id: request.params.id }
        );
        return response.json(result);
    } catch (error) {
        console.log(error);
        return response.status(500).send(error.message);
    }
});

// Create a new empty workout for the day and return the record
router.post("/", async (request, response) => {
    try {
        const { day } = request.body;
        const workoutDate = (day) ? new Date(day) : new Date(Date.now());

        const result = await db.Workout.create({
            day: workoutDate,
            exercises: []
        });
        return response.json(result);
    } catch (error) {
        if (error.name == 'ValidationError') {
            return response.status(422).json(error);
        }
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

/**
 * Returns a mongodb find filter used to fetch all workouts between the previous day
 * and the current workout (if any)
 * @param {*} workoutDate the date from which to get the previous record
 * @param {*} workoutId current workout id (if available) 
 */
function fetchPreviousFilter(workoutDate, workoutId) {
    const previousDay = moment(new Date(workoutDate)).subtract(1, 'days').startOf('day');
    const currentDay = moment(new Date(workoutDate)).endOf('day');
    // Find all records between the previous day and current workout day
    let $filter = {
        "day": {
            "$gte": previousDay.toDate(),
            "$lte": currentDay.toDate()
        }
    };
    // If the user is currently on a workout - only get workouts BEFORE that one
    if (workoutId) {
        $filter["_id"] = {
            "$lt": workoutId
        }
    };
    return $filter;
}

/**
 * Returns a mongodb find filter used to fetch all workouts between the 
 * current workout (if any) and the next day
 * @param {*} workoutDate the date from which to get the next record
 * @param {*} workoutId current workout id (if available) 
 */
function fetchNextFilter(workoutDate, workoutId) {
    const nextDay = moment(new Date(workoutDate)).add(1, 'days').endOf('day');
    const currentDay = moment(new Date(workoutDate)).startOf('day');
    // Find all records between the current workout day and the next day
    let $filter = {
        "day": {
            "$gte": currentDay.toDate(),
            "$lte": nextDay.toDate()
        }
    };
    // If the user is currently on a workout - only get workouts AFTER that one
    if (workoutId) {
        $filter["_id"] = {
            "$gt": workoutId
        }
    };
    return $filter;
}

module.exports = router;