
// the format used to display the week interval
const dayDisplayFormat = "D MMM YY";
// Selected date is today by default
var selectedDate = moment().startOf('day');
var currentWeekDisplayEl = document.querySelector("#currentWeek");
var previousEl = document.querySelector("#previous");
var nextEl = document.querySelector("#next");
let lineChart, barChart, pieChart, donutChart;

function generatePalette() {
  const arr = [
    "#003f5c",
    "#2f4b7c",
    "#665191",
    "#a05195",
    "#d45087",
    "#f95d6a",
    "#ff7c43",
    "ffa600",
    "#003f5c",
    "#2f4b7c",
    "#665191",
    "#a05195",
    "#d45087",
    "#f95d6a",
    "#ff7c43",
    "ffa600"
  ]

  return arr;
}

function populateChart(data) {
  const { weekdaySummary, exerciseSummary } = data;
  const colors = generatePalette();
  const exerciseNames = fetchFromDataSet(exerciseSummary, "exerciseName");

  let line = document.querySelector("#canvas").getContext("2d");
  let bar = document.querySelector("#canvas2").getContext("2d");
  let pie = document.querySelector("#canvas3").getContext("2d");
  let pie2 = document.querySelector("#canvas4").getContext("2d");

  if (lineChart) lineChart.destroy();
  if (barChart) barChart.destroy();
  if (pieChart) pieChart.destroy();
  if (donutChart) donutChart.destroy();

  lineChart = new Chart(line, {
    type: "line",
    data: {
      labels: [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"
      ],
      datasets: [
        {
          label: "Workout Duration In Minutes",
          backgroundColor: "red",
          borderColor: "red",
          data: fetchFromDataSet(weekdaySummary, "duration"),
          fill: false,
          spanGaps: true
        }
      ]
    },
    options: {
      responsive: true,
      title: {
        display: true
      },
      scales: {
        xAxes: [
          {
            display: true,
            scaleLabel: {
              display: true
            }
          }
        ],
        yAxes: [
          {
            display: true,
            scaleLabel: {
              display: true
            }
          }
        ]
      }
    }
  });

  barChart = new Chart(bar, {
    type: "bar",
    data: {
      labels: [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ],
      datasets: [
        {
          label: "Pounds",
          data: fetchFromDataSet(weekdaySummary, "weight"),
          backgroundColor: [
            "rgba(255, 99, 132, 0.2)",
            "rgba(54, 162, 235, 0.2)",
            "rgba(255, 206, 86, 0.2)",
            "rgba(75, 192, 192, 0.2)",
            "rgba(153, 102, 255, 0.2)",
            "rgba(255, 159, 64, 0.2)"
          ],
          borderColor: [
            "rgba(255, 99, 132, 1)",
            "rgba(54, 162, 235, 1)",
            "rgba(255, 206, 86, 1)",
            "rgba(75, 192, 192, 1)",
            "rgba(153, 102, 255, 1)",
            "rgba(255, 159, 64, 1)"
          ],
          borderWidth: 1
        }
      ]
    },
    options: {
      title: {
        display: true,
        text: "Pounds Lifted"
      },
      scales: {
        yAxes: [
          {
            ticks: {
              beginAtZero: true
            }
          }
        ]
      }
    }
  });

  pieChart = new Chart(pie, {
    type: "pie",
    data: {
      labels: exerciseNames,
      datasets: [
        {
          label: "Excercise Duration In Minutes",
          backgroundColor: colors,
          data: fetchFromDataSet(exerciseSummary, "duration")
        }
      ]
    },
    options: {
      title: {
        display: true,
        text: "Excercise Duration In Minutes"
      }
    }
  });

  donutChart = new Chart(pie2, {
    type: "doughnut",
    data: {
      labels: exerciseNames,
      datasets: [
        {
          label: "Pounds Lifted per Excercise",
          backgroundColor: colors,
          data: fetchFromDataSet(exerciseSummary, "weight")
        }
      ]
    },
    options: {
      title: {
        display: true,
        text: "Pounds Lifted per Excercise"
      }
    }
  });
}

/** Fetches all values for a given field from the dataset passed */
function fetchFromDataSet(dataSet, columnValue) {
  if (dataSet === null) {
    // No Data Found for this week
    return [];
  }
  return dataSet.map(data => data[columnValue]);
}

async function loadStats() {
  try {
    const data = await API.getWorkoutsInRange(selectedDate.toDate());
    if (data.weekStartDate && data.weekEndDate) {
      console.log(data.weekStartDate, data.x, data.a);
      console.log(moment(data.weekStartDate), moment(data.x), moment(data.a));
      console.log(data.weekEndDate, data.y, data.b);
      console.log(moment(data.weekEndDate), moment(data.y), moment(data.b));
      const startDate = moment(data.weekStartDate).format(dayDisplayFormat);
      const endDate = moment(data.weekEndDate).format(dayDisplayFormat);
      currentWeekDisplayEl.textContent = `${startDate} - ${endDate}`;
    }
    populateChart(data);
  } catch (error) {
    console.log(error);
  }
}

/** Moves to the previous week */
function previousButtonClicked() {
  selectedDate.subtract(1, 'weeks');
  loadStats();
}

/** Moves to the next week */
function nextButtonClicked() {
  selectedDate.add(1, 'weeks');
  loadStats();
}

loadStats();

previousEl.addEventListener("click", previousButtonClicked);
nextEl.addEventListener("click", nextButtonClicked);
