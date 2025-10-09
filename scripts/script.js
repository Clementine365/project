// ======== ELEMENTS ========
const taskForm = document.getElementById("taskForm");
const taskList = document.getElementById("taskList");
const message = document.getElementById("message");
const currentTasksDiv = document.getElementById("currentTasks");
const pastTasksDiv = document.getElementById("pastTasks");
const dayOverview = document.getElementById("dayOverview");
const notesArea = document.getElementById("notesArea");
const saveNotes = document.getElementById("saveNotes");
const saveMessage = document.getElementById("saveMessage");
const backToTopBtn = document.getElementById("backToTop");

// ======== TASK FUNCTIONS ========
function loadTasks() {
  const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  if (!taskList) return;
  taskList.innerHTML = "";
  tasks.sort((a, b) => new Date(a.date) - new Date(b.date)); // sort by date
  tasks.forEach(task => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${task.date}</strong> (${task.day}) - ${task.time} to ${task.endTime}: ${task.title}
      <button onclick="editTask('${task.date}', '${task.time}')">Edit</button>
      <button onclick="deleteTask('${task.date}', '${task.time}')">Delete</button>`;
    taskList.appendChild(li);
  });
}

// ======== ADD TASK ========
if (taskForm) {
  taskForm.addEventListener("submit", e => {
    e.preventDefault();
    const title = taskForm.taskName.value.trim();
    const day = taskForm.taskDay.value;
    const date = taskForm.taskDate.value;
    const time = taskForm.taskTime.value;
    const endTime = taskForm.taskEndTime.value;
    const details = taskForm.taskDetails.value.trim();

    if (!title || !day || !date || !time || !endTime) return;

    const taskStart = new Date(`${date}T${time}`);
    const now = new Date();

    if (taskStart < now) {
      message.textContent = "⚠️ You can’t schedule a task in the past.";
      message.style.color = "red";
      return;
    }

    const tasks = JSON.parse(localStorage.getItem("tasks")) || [];

    const duplicate = tasks.some(t =>
      t.date === date && (
        (time >= t.time && time < t.endTime) ||
        (endTime > t.time && endTime <= t.endTime)
      )
    );

    if (duplicate) {
      message.textContent = "⚠️ This time slot is already booked for that day.";
      message.style.color = "red";
      return;
    }

    tasks.push({ title, day, date, time, endTime, details, completed: false });
    localStorage.setItem("tasks", JSON.stringify(tasks));
    message.textContent = "✅ Task added successfully!";
    message.style.color = "green";
    taskForm.reset();
    loadTasks();
    renderWeekView();
    renderDayOverview();
  });
}

// ======== DELETE TASK ========
function deleteTask(date, time) {
  let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  tasks = tasks.filter(t => !(t.date === date && t.time === time));
  localStorage.setItem("tasks", JSON.stringify(tasks));
  loadTasks();
  renderWeekView();
  renderDayOverview();
}

// ======== EDIT TASK ========
function editTask(date, time) {
  const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  const index = tasks.findIndex(t => t.date === date && t.time === time);
  if (index === -1) return;

  const task = tasks[index];
  const newTitle = prompt("Edit Task Title:", task.title) || task.title;
  const newTime = prompt("Edit Start Time (HH:MM):", task.time) || task.time;
  const newEndTime = prompt("Edit End Time (HH:MM):", task.endTime) || task.endTime;

  const editDate = new Date(`${task.date}T${newTime}`);
  const now = new Date();
  if (editDate < now) {
    alert("⚠️ You cannot move a task to the past.");
    return;
  }

  const duplicate = tasks.some((t, i) => i !== index && t.date === task.date && (
    (newTime >= t.time && newTime < t.endTime) ||
    (newEndTime > t.time && newEndTime <= t.endTime)
  ));
  if (duplicate) {
    alert("⚠️ Time slot already booked for that day.");
    return;
  }

  task.title = newTitle;
  task.time = newTime;
  task.endTime = newEndTime;
  tasks[index] = task;
  localStorage.setItem("tasks", JSON.stringify(tasks));
  loadTasks();
  renderWeekView();
  renderDayOverview();
}

// ======== WEEK-PLANNER CURRENT & PAST TASKS ========
function renderWeekView() {
  const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  const now = new Date();

  if (currentTasksDiv) currentTasksDiv.innerHTML = "";
  if (pastTasksDiv) pastTasksDiv.innerHTML = "";

  tasks.sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));

  tasks.forEach(task => {
    const start = new Date(`${task.date}T${task.time}`);
    const end = new Date(`${task.date}T${task.endTime}`);

    const li = document.createElement("li");
    li.textContent = `${task.date} (${task.day}) ${task.time}-${task.endTime}: ${task.title}`;

    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    editBtn.onclick = () => editTask(task.date, task.time);

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.onclick = () => deleteTask(task.date, task.time);

    if (end >= now) {
      li.appendChild(editBtn);
      li.appendChild(deleteBtn);
      currentTasksDiv?.appendChild(li);
    } else {
      li.appendChild(deleteBtn);
      pastTasksDiv?.appendChild(li);
    }
  });
}

// ======== UPDATED DAY OVERVIEW (shows all 7 days) ========
function renderDayOverview() {
  if (!dayOverview) return;
  const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  dayOverview.innerHTML = "";

  const today = new Date();

  // Generate next 7 days
  for (let i = 0; i < 7; i++) {
    const day = new Date(today);
    day.setDate(today.getDate() + i);

    const dateStr = day.toISOString().split("T")[0];
    const weekday = day.toLocaleDateString("en-US", { weekday: "long" });

    const dayBox = document.createElement("div");
    dayBox.className = "day-card";

    const heading = document.createElement("h3");
    heading.textContent = `${weekday} (${dateStr})`;
    dayBox.appendChild(heading);

    const dayTasks = tasks.filter(t => t.date === dateStr);

    if (dayTasks.length > 0) {
      dayBox.classList.add("busy");
      const ul = document.createElement("ul");
      dayTasks.forEach(task => {
        const li = document.createElement("li");
        li.textContent = `${task.time}-${task.endTime}: ${task.title}`;
        ul.appendChild(li);
      });
      dayBox.appendChild(ul);
    } else {
      dayBox.classList.add("free");
      const p = document.createElement("p");
      p.textContent = "No tasks — Free day ✅";
      dayBox.appendChild(p);
    }

    dayOverview.appendChild(dayBox);
  }
}

// ======== NOTES ========
if (notesArea && saveNotes) {
  notesArea.value = localStorage.getItem("userNotes") || "";
  saveNotes.addEventListener("click", () => {
    localStorage.setItem("userNotes", notesArea.value);
    saveMessage.textContent = "✅ Notes saved successfully!";
    setTimeout(() => (saveMessage.textContent = ""), 2000);
  });
}

// ======== BACK TO TOP ========
if (backToTopBtn) {
  window.onscroll = () =>
    (backToTopBtn.style.display = window.scrollY > 200 ? "block" : "none");
  backToTopBtn.onclick = () =>
    window.scrollTo({ top: 0, behavior: "smooth" });
}

// ======== INIT ========
loadTasks();
renderWeekView();
renderDayOverview();
