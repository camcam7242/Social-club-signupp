document.getElementById("signupForm").addEventListener("submit", function (event) {
  event.preventDefault();
  this.classList.add("hidden");
  document.getElementById("successMessage").classList.remove("hidden");
});
