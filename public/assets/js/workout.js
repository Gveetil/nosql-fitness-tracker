const previousEl = document.querySelector("#previous");
const nextEl = document.querySelector("#next");
const continueEl = document.querySelector("#continue-btn");
const newWorkoutEl = document.querySelector("#new-btn");
const deleteEl = document.querySelector("#delete-btn");
const toast = document.querySelector("#toast");
const dayDisplayFormat = "D MMM YYYY";
let currentWorkoutDate;
let currentOperation;
let currentWorkoutId;

async function initWorkout() {
  let lastWorkout = await API.getLastWorkout(currentWorkoutId, currentWorkoutDate, currentOperation);
  console.log("Current workout:", lastWorkout);
  if (lastWorkout) {
    currentWorkoutDate = moment(lastWorkout.day).utc();
    currentWorkoutId = lastWorkout._id;
    const workoutSummary = {
      date: moment(currentWorkoutDate).format(dayDisplayFormat),
      totalDuration: lastWorkout.totalDuration,
      numExercises: lastWorkout.exercises.length,
      ...tallyExercises(lastWorkout.exercises)
    };

    renderWorkoutSummary(workoutSummary);
  } else {
    currentWorkoutId = null;
    if (currentWorkoutDate) {
      if (currentOperation === "P")
        currentWorkoutDate = moment(currentWorkoutDate).subtract(1, 'days').startOf('day').utc();
      else
        currentWorkoutDate = moment(currentWorkoutDate).add(1, 'days').startOf('day').utc();
    } else {
      currentWorkoutDate = moment().startOf('day').utc();
    }
    renderNoWorkoutText()
  }
  initializeButtons();
}

function tallyExercises(exercises) {
  const tallied = exercises.reduce((acc, curr) => {
    if (curr.type === "resistance") {
      acc.totalWeight = (acc.totalWeight || 0) + curr.weight;
      acc.totalSets = (acc.totalSets || 0) + curr.sets;
      acc.totalReps = (acc.totalReps || 0) + curr.reps;
    } else if (curr.type === "cardio") {
      acc.totalDistance = (acc.totalDistance || 0) + curr.distance;
    }
    return acc;
  }, {});
  return tallied;
}

function renderWorkoutSummary(summary) {
  const container = document.querySelector(".workout-stats");
  container.textContent = "";

  const workoutKeyMap = {
    date: "Date",
    totalDuration: "Total Workout Duration",
    numExercises: "Exercises Performed",
    totalWeight: "Total Weight Lifted",
    totalSets: "Total Sets Performed",
    totalReps: "Total Reps Performed",
    totalDistance: "Total Distance Covered"
  };

  Object.keys(summary).forEach(key => {
    const p = document.createElement("p");
    const strong = document.createElement("strong");

    strong.textContent = workoutKeyMap[key];
    const textNode = document.createTextNode(`: ${summary[key]}`);

    p.appendChild(strong);
    p.appendChild(textNode);

    container.appendChild(p);
  });
}

function renderNoWorkoutText() {
  const container = document.querySelector(".workout-stats");
  container.textContent = "";
  const workoutSummary = {
    date: currentWorkoutDate.format(dayDisplayFormat)
  }
  renderWorkoutSummary(workoutSummary);
  const p = document.createElement("p");
  const strong = document.createElement("strong");
  p.appendChild(document.createElement("br"));
  strong.textContent = "You have not created a workout yet!"
  p.appendChild(strong);
  container.appendChild(p);
}

function handleToastAnimationEnd() {
  toast.removeAttribute("class");
}

function initializeButtons() {
  const workoutDate = moment(currentWorkoutDate).startOf('day').hour(12).utc();
  newWorkoutEl.setAttribute("href", `/exercise?workoutdate=${workoutDate.utc().toDate().toISOString()}`);
  if (currentWorkoutId) {
    continueEl.classList.remove("disabled");
    continueEl.setAttribute("href", `/exercise?id=${currentWorkoutId}`);
    deleteEl.classList.remove("d-none");
  } else {
    continueEl.classList.add("disabled");
    continueEl.setAttribute("href", "");
    deleteEl.classList.add("d-none");
  }
}

/** Deletes the current workout */
async function deleteButtonClicked() {
  event.preventDefault();
  await API.deleteWorkout(currentWorkoutId);
  toast.classList.add("success");
  // Load previous record
  currentOperation = "P";
  initWorkout();
}

/** Moves to the previous workout */
function previousButtonClicked(event) {
  event.preventDefault();
  currentOperation = "P";
  initWorkout();
}

/** Moves to the next workout */
function nextButtonClicked(event) {
  event.preventDefault();
  currentOperation = "N";
  initWorkout();
}

initWorkout();

toast.addEventListener("animationend", handleToastAnimationEnd);
previousEl.addEventListener("click", previousButtonClicked);
nextEl.addEventListener("click", nextButtonClicked);
deleteEl.addEventListener("click", deleteButtonClicked);