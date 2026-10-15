const form = document.getElementById("task-form");
const input = document.getElementById("task-input");
const taskList = document.getElementById("task-list");
const taskCount = document.getElementById("task-count");
const completedCount = document.getElementById("completed-count");
const message = document.getElementById("message");

async function request(url, options = {}) {
    const response = await fetch(url, options);

    if (!response.ok) {
        const detail = await response.text();
        throw new Error(detail || `HTTP ${response.status}`);
    }

    if (response.status === 204) {
        return null;
    }

    return response.json();
}

async function loadTasks() {
    try {
        message.textContent = "";

        const tasks = await request("/api/tasks");
        taskList.replaceChildren();

        let completed = 0;

        tasks.forEach((task) => {
            if (task.completed) completed++;

            const item = document.createElement("li");
            item.className = "task" + (task.completed ? " done" : "");

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = task.completed;
            checkbox.setAttribute(
                "aria-label",
                `Mark ${task.title} as completed`
            );

            checkbox.addEventListener("change", async () => {
                try {
                    await request(`/api/tasks/${task.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ completed: checkbox.checked })
                    });
                    await loadTasks();
                } catch (error) {
                    message.textContent = error.message;
                    await loadTasks();
                }
            });

            const title = document.createElement("span");
            title.className = "task-title";
            title.textContent = task.title;

            const deleteButton = document.createElement("button");
            deleteButton.className = "delete";
            deleteButton.textContent = "Delete";

            deleteButton.addEventListener("click", async () => {
                try {
                    await request(`/api/tasks/${task.id}`, {
                        method: "DELETE"
                    });
                    await loadTasks();
                } catch (error) {
                    message.textContent = error.message;
                }
            });

            item.append(checkbox, title, deleteButton);
            taskList.appendChild(item);
        });

        taskCount.textContent =
            `${tasks.length} ${tasks.length === 1 ? "task" : "tasks"}`;
        completedCount.textContent = `${completed} completed`;
    } catch (error) {
        message.textContent = `Could not load tasks: ${error.message}`;
    }
}

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const title = input.value.trim();
    if (!title) return;

    try {
        await request("/api/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: title })
        });

        input.value = "";
        await loadTasks();
    } catch (error) {
        message.textContent = error.message;
    }
});

loadTasks();