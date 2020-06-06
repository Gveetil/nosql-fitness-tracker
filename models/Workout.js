const mongoose = require("mongoose");

const WorkoutSchema = new mongoose.Schema({
    day: {
        type: mongoose.Schema.Types.Date,
        required: [true, 'Day cannot be empty!']
    },
    exercises: [{
        type: {
            type: mongoose.Schema.Types.String,
            trim: true,
            enum: ['cardio', 'resistance'],
            required: [true, 'Exercise type cannot be empty!']
        },
        name: {
            type: mongoose.Schema.Types.String,
            trim: true,
            required: [true, 'Exercise name cannot be empty!']
        },
        duration: {
            type: mongoose.Schema.Types.Number,
            required: true,
            default: 0,
            min: [0, 'Invalid Entry!'],
            max: [1000, 'Duration cannot exceed 1000!']
        },
        distance: {
            type: mongoose.Schema.Types.Number,
            min: [0, 'Invalid Entry!'],
            max: [1000, 'Distance cannot exceed 1000!']
        },
        weight: {
            type: mongoose.Schema.Types.Number,
            min: [0, 'Invalid Entry!'],
            max: [2000, 'Weight cannot exceed 2000!']
        },
        reps: {
            type: mongoose.Schema.Types.Number,
            min: [0, 'Invalid Entry!'],
            max: [1000, 'Reps cannot exceed 1000!']
        },
        sets: {
            type: mongoose.Schema.Types.Number,
            min: [0, 'Invalid Entry!'],
            max: [1000, 'Sets cannot exceed 1000!']
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