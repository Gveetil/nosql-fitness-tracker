const API = {
  async getLastWorkout(workoutId = null, workoutDate = null, operation = null) {
    let res;
    try {
      let queryUrl;
      if (workoutDate && operation) {
        // Load previous / next workout based on date and current workout id (if available) 
        queryUrl = `/api/workouts/${workoutDate.toDate().toISOString()}/${operation}`
        if (workoutId)
          queryUrl = `${queryUrl}/${workoutId}`;

      } else {
        // Load the last workout entry by default
        queryUrl = "/api/workouts";
      }
      res = await fetch(queryUrl);
    } catch (err) {
      console.log(err)
    }
    const json = await res.json();

    return json[json.length - 1];
  },
  async addExercise(data, id) {
    try {
      const res = await fetch("/api/workouts/" + id, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      if (res.status == 422) {
        let data = await res.json()
        console.log(data);
        alert(data);
        return false;
      }
      return true;

    } catch (error) {
      console.log(error);
      alert(error.message);
      return false;
    }
  },
  async createWorkout(data = {}) {
    const res = await fetch("/api/workouts", {
      method: "POST",
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json" }
    });

    const json = await res.json();

    return json;
  },

  async deleteWorkout(id) {
    const res = await fetch(`/api/workouts/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" }
    });

    const json = await res.json();

    return json;
  },

  async getWorkoutsInRange(fromDate) {
    const res = await fetch(`/api/workouts/range/${fromDate.toISOString()}`);

    const json = await res.json();

    return json;
  },
};
