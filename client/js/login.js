// password show/hide toggle functionality
const toggles = document.querySelectorAll(".toggle-password");

toggles.forEach(toggle => {
  toggle.addEventListener("click", () => {
    const targetId = toggle.getAttribute("data-target");
    const input = document.getElementById(targetId);

    if (input.type === "password") {
      input.type = "text";
      toggle.textContent = "Hide";
    } else {
      input.type = "password";
      toggle.textContent = "Show";
    }
  });
});

const form = document.querySelector("form");
const loginMessage = document.getElementById("loginMessage");

// form submission handler for login
form.addEventListener("submit", async (e) => {

  e.preventDefault();
  loginMessage.textContent = ""; // clear previous messages

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const response = await fetch("/api/login", {

    method: "POST", // sends data to server
    headers: {
      "Content-Type": "application/json" // specify that we're sending JSON data
    },
    body: JSON.stringify({
      email,
      password
    })
  });

  const data = await response.json(); // response from server - either a redirect or an error message

  if (response.ok) {
    window.location.href = data.redirect; // redirect to the URL provided by the server (either admin dashboard or home page, based on role)
  } else {
    loginMessage.textContent = data.message || "Login failed. Please try again."; // display error message, and a fallback message in case the server doesn't parse the response body properly
    loginMessage.style.color = "red";
  }
});