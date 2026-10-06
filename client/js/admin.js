// display success messages for adding routes and schedules for only 3 seconds
function showMessage(element, text, type = "success") {

    element.textContent = text;
    element.className = `server-message ${type}`;
    element.style.opacity = "1";

    setTimeout(() => {
        element.style.opacity = "0"; // fade out effect
    }, 3000);
}

// populate the dropdown menu with routes - for adding schedules, schedule viewing, and report generation
async function loadRouteDropdowns() {
    const response = await fetch("/routes");
    const routes = await response.json(); // convert and store routes as objects in JSON format

    const dropdownIds = ["routeSelect", "viewRouteSelect", "reportRouteSelect", "deleteRouteSelect"];

    dropdownIds.forEach(id => {
        const select = document.getElementById(id);

        if (!select) return;

        if (id === "deleteRouteSelect") {
            select.innerHTML = '<option value="">Select Route to Delete</option>';
        } else {
            select.innerHTML = '<option value="">Select Route</option>';
        }

        routes.forEach(route => {
            const option = document.createElement("option");

            option.value = route.id;
            option.textContent =
                `${route.route_name} – (${route.start_stop} to ${route.end_stop})`;

            select.appendChild(option);
        });
    });
}
loadRouteDropdowns();

// send routes to database
document.getElementById("routeForm").addEventListener("submit", async (e) => {
    e.preventDefault(); // prevents default form submission behavior which would cause a page reload

    const message = e.target.querySelector(".server-message");
    message.textContent = "";

    const formData = new FormData(e.target); // formdata object automatically captures all form input values

    const response = await fetch("/add-route", {
        method: "POST",
        body: new URLSearchParams(formData) // converts the form data into standard HTML format for form submissions (URLencoded string)
    });

    const result = await response.json();
    
   showMessage(message, result.message, response.ok ? "success" : "error");

    // if (response.ok) {
    //     showMessage(message, result.message, "success");
    // } else {
    //     showMessage(message, result.message, "error");
    // }
    
    e.target.reset(); // reset the form fields to be empty after submission

    loadRouteDropdowns(); // refresh route dropdown after adding a new route
});

// delete routes from database
document
.getElementById("deleteRouteBtn")
.addEventListener("click", async function () {
   
    const select = document.getElementById("deleteRouteSelect");
    const routeId = select.value;

    const message = select.parentElement.querySelectorAll(".server-message")[1];

    message.textContent = "";

    if (!routeId) {
        showMessage(message, "Please select a route to delete.", "error");
        return;
    }
    const confirmDelete = confirm("Are you sure you want to delete this route?");

    if (!confirmDelete) return;

    try {
        const response = await fetch(`/delete-route/${routeId}`, {
            method: "DELETE"
        });
        const result = await response.json();

        showMessage(message, result.message, response.ok ? "success" : "error");

        if (response.ok) {
            loadRouteDropdowns(); // refresh all dropdowns instanly
        }
    } catch (error) {
        showMessage(message, "Error deleting route.", "error");
    }
});

// send schedules to database
document.getElementById("scheduleForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const message = e.target.querySelector(".server-message");
    message.textContent = "";

    const formData = new FormData(e.target); 

    const response = await fetch("/add-schedule", {
        method: "POST",
        body: new URLSearchParams(formData)
    });

    const result = await response.json();

    showMessage(message, result.message, response.ok ? "success" : "error");
    
    e.target.reset(); // reset schedule fields after submission
});

// display schedules when a route is selected
document
.getElementById("viewSchedulesBtn")
.addEventListener("click", async function () {
    
    const routeId = document.getElementById("viewRouteSelect").value;
    const scheduleList = document.getElementById("scheduleList");

    scheduleList.innerHTML = ""; // clear prev schedules from the display when a new route is selected

    // if button is clicked when a route has not been selected, return a message
    if (!routeId) {
        scheduleList.innerHTML = `<p class="schedules-message">Select a route to display schedules.</p>`;
        return;
    }

    const response = await fetch(`/route-schedules/${routeId}`);

    const schedules = await response.json();
    // if there are no schedules associated with the route yet, return a message
    if (schedules.length === 0) {
        scheduleList.innerHTML = `<p class="schedules-message">No schedules for this route yet.</p>`
        return;
    }

    let tableHTML = `
    <table class="schedule-table">
        <thead>
            <tr>
                <th>Departure</th>
                <th>Arrival</th>
                <th></th> <!-- empty header for delete button column -->
            </tr>
        </thead>
        <tbody>
    `;

    schedules.forEach(schedule => {

        const departure = schedule.departure_time.slice(0,5);
        const arrival = schedule.arrival_time.slice(0,5);

        tableHTML += `
            <tr>
                <td>${departure}</td>
                <td>${arrival}</td>
                <td>
                    <button class="delete-btn" onclick="deleteSchedule(${schedule.id})">
                        Delete
                    </button>
                </td>
            </tr>
        `;
    });

    tableHTML += `
        </tbody>
    </table>
    `;
    scheduleList.innerHTML = tableHTML; 
});

//delete schedules
async function deleteSchedule(scheduleId) {
    
    const message = document.querySelector(".schedule-viewer-card .server-message");
    message.textContent = "";

    const confirmDelete = confirm("Are you sure you want to delete this schedule?");
    
    if (!confirmDelete) return;

    try {
        const response = await fetch(`/delete-schedule/${scheduleId}`, {
            method: "DELETE"
        });
        const result = await response.json();

        showMessage(message, result.message, response.ok ? "success" : "error");

        if (response.ok) {
            document.getElementById("viewSchedulesBtn").click(); // refresh the schedule display by simulating a click on the view schedules button, which will fetch and display the updated list of schedules without the deleted one
        }

    } catch (error) {
        showMessage(message, "Error deleting schedule.", "error");
    }
}

// display reports
document
.getElementById("generateReportBtn")
.addEventListener("click", async function () {
    
    const routeId = document.getElementById("reportRouteSelect").value;
    const reportOutput = document.getElementById("reportOutput");

    reportOutput.innerHTML = "";

    if (!routeId) { // display a message if the button is clicked without having selected a route first
        reportOutput.innerHTML = `<p class="reports-message">Select a route to generate a report.</p>`;
        return;
    }

    const response = await fetch(`/route-report/${routeId}`); // fetch the report data for the selected route from the server
    const report = await response.json();

    if (!report.total_schedules || report.total_schedules === "0") { // display a message instead of an empty table if there are no schedules for the route yet, since all report metrics are based on the schedules associated with the route
        reportOutput.innerHTML = `<p class="reports-message">No information available for this route yet.</p>`;
        return;
    }

    const firstDeparture = report.first_departure.slice(0,5);
    const lastDeparture = report.last_departure.slice(0,5);
    const avgDuration = report.avg_duration;
    const avgFrequency = report.avg_frequency ? `Every ${report.avg_frequency} minutes` : "N/A"; // if there is only one schedule, avg frequency will be null since it is calculated based on the time difference between schedules, so we display N/A instead

    reportOutput.innerHTML = `
    <table class="report-table">
        <thead>
            <tr>
                <th>Metric</th>
                <th>Value</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Number of Schedules</td>
                <td>${report.total_schedules}</td>
            </tr>
            <tr>
                <td>First Departure</td>
                <td>${firstDeparture}</td>
            </tr>
            <tr>
                <td>Last Departure</td>
                <td>${lastDeparture}</td>
            </tr>
            <tr>
                <td>Average Trip Duration</td>
                <td>${avgDuration} minutes</td>
            </tr>
            <tr>
                <td>Average Trip Frequency</td>
                <td>${avgFrequency}</td>
            </tr>
        </tbody>
    </table>
    `;
});

// dropdown click toggle
document.querySelectorAll('.icon-btn').forEach(button => {
    button.addEventListener('click', function (e) {
        e.stopPropagation(); // dropdown remains open when clicking inside the menu, and only closes when clicking outside of it

        // close other dropdowns to prevent multiple open menus at the same time
        document.querySelectorAll('.dropdown-content').forEach(menu => {
            if (menu !== this.nextElementSibling) { // prevents multiple dropdowns being open at the same time
                menu.style.display = 'none';
            }
        });

        const dropdown = this.nextElementSibling;
        dropdown.style.display =
            dropdown.style.display === 'flex' ? 'none' : 'flex';
    });
});

// close dropdown when clicking outside of it
document.addEventListener('click', () => {
    document.querySelectorAll('.dropdown-content').forEach(menu => {
        menu.style.display = 'none';
    });
});

// fetch user session data to display welcome message with user's name
fetch("/api/session") 
    .then(res => res.json())
    .then(data => {
        if (data.loggedIn) {
            document.querySelector(".welcome-message h4").textContent =
            `Welcome back, ${data.user.name}!👋`;
        }
    });

// functionality for logout button
const logoutBtn = document.getElementById("logOutBtn");

if (logoutBtn) {
    logoutBtn.addEventListener("click", async (e) => {
        try {
            const response = await fetch("/api/logout", {
                method: "POST"
            });

            const result = await response.json();

            if (response.ok) {
                window.location.href = result.redirect;
            } else {
                alert(result.message);
            }
        } catch (error) {
            alert(result.message);
        }
    });
}