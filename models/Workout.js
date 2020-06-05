const mongoose = require("mongoose");

const WorkoutSchema = new mongoose.Schema({
    day: {
        type: mongoose.Schema.Types.Date
    },
    exercises: [{
        type: {
            type: mongoose.Schema.Types.String,
            enum: ['cardio', 'resistance'],
            required: true
        },
        name: {
            type: mongoose.Schema.Types.String,
            required: true
        },
        duration: {
            type: mongoose.Schema.Types.Number,
            required: true,
            default: 0,
            validate: {
                validator: Number.isInteger,
                message: '{VALUE} is not an integer value'
            }
        },
        distance: {
            type: mongoose.Schema.Types.Number,
            default: 0,
            validate: {
                validator: Number.isInteger,
                message: '{VALUE} is not an integer value'
            }
        },
        weight: {
            type: mongoose.Schema.Types.Number,
            default: 0,
            validate: {
                validator: Number.isInteger,
                message: '{VALUE} is not an integer value'
            }
        },
        reps: {
            type: mongoose.Schema.Types.Number,
            default: 0,
            validate: {
                validator: Number.isInteger,
                message: '{VALUE} is not an integer value'
            }
        },
        sets: {
            type: mongoose.Schema.Types.Number,
            default: 0,
            validate: {
                validator: Number.isInteger,
                message: '{VALUE} is not an integer value'
            }
        },
        _id: false
    }]
});

WorkoutSchema.set('toObject', { virtuals: true });
WorkoutSchema.set('toJSON', { virtuals: true });

WorkoutSchema.virtual('totalDuration').get(function () {
    let totalDuration = 0;
    this.exercises.forEach(element => totalDuration += element.duration || 0);
    return totalDuration;
});

const Workout = mongoose.model("Workout", WorkoutSchema);

module.exports = Workout;