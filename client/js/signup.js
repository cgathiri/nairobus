// show/hide password
const toggles = document.querySelectorAll(".toggle-password");

// add event listeners to show/hide password "buttons"
toggles.forEach(toggle => {
  toggle.addEventListener("click", () => {
    const targetId = toggle.getAttribute("data-target"); // retrieves value of the data-target attribute
    const input = document.getElementById(targetId); // gets the input element that corresponds to the data-target value (either password or confirmPassword)

    if (input.type === "password") {
      input.type = "text";
      toggle.textContent = "Hide";
    } else {
      input.type = "password";
      toggle.textContent = "Show";
    }
  });
});

// password validation & confirmation
const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirmPassword");

const passwordMessage = document.getElementById("passwordMessage");

function validatePassword() {
  const value = password.value;

  // password complexity rules
  const hasLength = value.length >= 8;
  const hasNumber = /\d/.test(value); // checks for at least one digit
  const hasLetter = /[a-zA-Z]/.test(value); // checks for at least one letter

  if (!hasLength) {
    passwordMessage.textContent = "Password must be at least 8 characters.";
    passwordMessage.style.color = "red";
    return false; // stop further validation if length requirement is not met
  }

  if (!hasNumber || !hasLetter) {
    passwordMessage.textContent = "Password must include letters and numbers.";
    passwordMessage.style.color = "red";
    return false; // stop further validation if complexity requirements are not met
  }

  if (password.value !== confirmPassword.value) {
    passwordMessage.textContent = "Passwords do not match.";
    passwordMessage.style.color = "red";
    return false; // stop further validation if passwords do not match
  }

  passwordMessage.textContent = "Password looks good.";
  passwordMessage.style.color = "green";
  return true; // all validations passed
}

password.addEventListener("input", validatePassword);
confirmPassword.addEventListener("input", validatePassword);

// email validation
const email = document.getElementById("email");
const emailMessage = document.getElementById("emailMessage");

email.addEventListener("input", () => {

    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // simple email regex pattern - checks for non-whitespace and non-@ characters before and after the @ symbol, and a dot followed by more characters

    if (pattern.test(email.value)) {
        emailMessage.textContent = "Email address looks good.";
        emailMessage.style.color = "green";
    } else {
        emailMessage.textContent = "Please enter a valid email address.";
        emailMessage.style.color = "red";
    }
});

// send form data to server
const form = document.querySelector("form");
const signupMessage = document.getElementById("signupMessage");

form.addEventListener("submit", async (e) => {

  e.preventDefault();
  signupMessage.textContent = ""; // clear previous messages

  const firstName = document.getElementById("firstName").value;
  const lastName = document.getElementById("lastName").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const response = await fetch("/api/signup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      firstName,
      lastName,
      email,
      password
    })
  });

  const data = await response.json();

  if (response.ok) {
    signupMessage.textContent = data.message; // display success message
    signupMessage.style.color = "green";
    
    setTimeout(() => { // this is a function that  executes after a defined delay period
      window.location.href = "home.html"; // redirect to home page
    }, 1500); // this delay allows the user to see the success message first before being redirected to the home page
  
  } else {
    signupMessage.textContent = data.message; // display error message
    signupMessage.style.color = "red";
  }
});