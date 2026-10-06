// map initialization
const map = L.map('map').setView([-1.286389, 36.817223], 13);

setTimeout(() => {
    map.invalidateSize(); // ensures map resizes correctly after page load
}, 200);

// adding carto map tile layer
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
  subdomains: 'abcd',
  maxZoom: 19
}).addTo(map);

let currentRoutingControl = null; // map route line, initial value set to null

// route coordinates for route drawing on map
const routeShapes = {
    15 : [ // tuskys to railways
        [-1.396920, 36.753181], // tuskys stage
        [-1.289760, 36.827969] // railways
    ],

    16 : [ // highrise to bs
        [-1.314602, 36.808041], // highrise
        [-1.297431, 36.805150], // kenyatta
        [-1.286789, 36.830351], // near racecourse road
        [-1.286402, 36.829616], // temple rd x uyoma st junction
        [-1.286831, 36.829421], // random point on temple rd 
        [-1.286535, 36.828780] // bus station (roadside coordinate)
    ]
};

function drawRoute(routeId) {
    
    // remove previous route first before drawing a new onw
    if (currentRoutingControl) { // check if there's an existing route on the map
        map.removeControl(currentRoutingControl); // remove the existing route from the map
        currentRoutingControl = null; // reset the variable
    }

    const coords = routeShapes[routeId];

    // if no coordinates have been provided for the selected route, exit this function
    if (!coords) {
        map.setView([-1.286389, 36.817223], 13); // reset map view to nairobi cbd coordinates
        return;
    }

    const waypoints = coords.map(coord => L.latLng(coord[0], coord[1]));

    currentRoutingControl = L.Routing.control({
        waypoints: waypoints,
        routeWhileDragging: false,
        draggableWaypoints: false,
        addWaypoints: false,
        show: false,
        //lineOptions: {
            //styles: [{ color: "#f59a2e", weight: 6 }]
        //},

        createMarker: function(i, waypoint, n) {

            // start marker
            if (i === 0) {
                return L.marker(waypoint.latLng);
            }

            // end marker
            if (i === n - 1) {
                return L.marker(waypoint.latLng);
            }

            return null; // hide markers for coordinates in the middle of the route
        }

    }).addTo(map);

    // zoom map to fit the route
    const bounds = L.latLngBounds(waypoints);

    map.flyToBounds(bounds, {
        padding: [50, 50], // add some padding around the route for better visibility
        duration: 1.5
    });
}

// event listener to get user's location and add a marker on the map
window.addEventListener("load", () => {
    // adding a marker for the user's location
    map.locate({ setView: true, maxZoom: 15 });
    // event listener for when the user's location is found
    map.on('locationfound', function(e) { // e is the event object that contains the user's location data
        L.marker(e.latlng)
            .addTo(map)
            .bindPopup("You are here")
            .openPopup();

        L.circle(e.latlng, {
            radius: 150
        }) .addTo(map);
    });

    // fallback to handle map position if location access is denied by user
    map.on('locationerror', function() {
        map.setView([-1.286389, 36.817223], 13); // display cbd coordinates instead
    });
});

// populate dropdown menu with routes
async function loadRoutesHome() {
    const response = await fetch("/routes");
    const routes = await response.json();

    const routeSelect = document.getElementById("routeSelectHome");

    routeSelect.innerHTML = '<option value="">Select Route</option>';

    routes.forEach(route => {
        const option = document.createElement("option");
        option.value = route.id;
        option.textContent =
            `${route.route_name} – (${route.start_stop} to ${route.end_stop})`;

        routeSelect.appendChild(option);
    });  
}
loadRoutesHome();

// display schedules when a route is selected
document
.getElementById("viewSchedulesHomeBtn")
.addEventListener("click", async function () {

    const routeId = document.getElementById("routeSelectHome").value;
    const resultsContainer = document.getElementById("routeResults");

    drawRoute(routeId); // draw route on map when user clicks the button to view schedules

    resultsContainer.innerHTML = "";

    if (!routeId) {
        resultsContainer.innerHTML = `<p class="schedules-message">Please select a route to display schedules.</p>`
        return;
    }

    const response = await fetch(`/route-schedules/${routeId}`);
    const schedules = await response.json();

    if (schedules.length === 0) {
        resultsContainer.innerHTML = `<p class="schedules-message">No buses scheduled yet.</p>`
        return;
    }

    let tableHTML = `
    <table class="schedule-table">
        <thead>
            <tr>
                <th>Departure</th>
                <th>Arrival</th>
            </tr>
        </thead>
        <tbody>
    `;

    schedules.forEach(schedule => {

        const departure = schedule.departure_time.slice(0,5); // the datetime string is in the format "HH:MM:SS", so we slice it to get just the "HH:MM" part for display
        const arrival = schedule.arrival_time.slice(0,5);

        tableHTML += `
            <tr>
                <td>${departure}</td>
                <td>${arrival}</td>
            </tr>
        `;
    });

    tableHTML += `
        </tbody>
    </table>
    `;
    resultsContainer.innerHTML = tableHTML;
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

// close dropdown when clicking outside
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
            document.querySelector(".planner-card h4").textContent =
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

// force window to redraw map correctly when screen shrinks
window.addEventListener("load", () => {
    setTimeout(() => {
        map.invalidateSize();
    }, 300);
});