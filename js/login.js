const loginBtn = document.getElementById("loginBtn");
const passwordInput = document.getElementById("password");
const error = document.getElementById("error");

const PASSWORD = "10 12 2025";

function login() {

    error.textContent = "";

    if (passwordInput.value === PASSWORD) {
        sessionStorage.setItem("loggedIn", "true");
        window.location.href = "book.html";
    } 
    else {
        error.textContent = "Incorrect password.";
        passwordInput.value = "";
        passwordInput.focus();
    }
}

loginBtn.addEventListener("click", login);

passwordInput.addEventListener("keydown", function(e){
    if(e.key === "Enter"){
        login();
    }
});