function toggleId() {
  const role = document.getElementById("role").value;
  const idField = document.getElementById("idField");

  if (role === "admin" || role === "pembina") {
    idField.style.display = "block";
    idField.required = true;
  } else {
    idField.style.display = "none";
    idField.required = false;
  }
}
