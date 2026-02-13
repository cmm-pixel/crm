// =============================
// Tower → Wing Mapping
// =============================
const towerSelect = document.getElementById("tower");
const wingSelect = document.getElementById("wing");

const wingsByTower = {
  TAPI: ["A Wing"],
  AMAZON: ["A Wing", "B Wing"],
  DANUBE: ["A Wing", "B Wing", "C Wing", "D Wing"]
};

towerSelect.addEventListener("change", function () {
  wingSelect.innerHTML = '<option value="">Select</option>';
  wingSelect.disabled = true;

  if (this.value && wingsByTower[this.value]) {
    wingsByTower[this.value].forEach(wing => {
      const option = document.createElement("option");
      option.value = wing;
      option.textContent = wing;
      wingSelect.appendChild(option);
    });
    wingSelect.disabled = false;
  }
});

// =============================
// Cancellation Form → Google Sheet
// =============================
document.getElementById("cancellationForm").addEventListener("submit", function (e) {
  e.preventDefault();

  if (!this.checkValidity()) {
    alert("Please fill all mandatory fields.");
    return;
  }

  const formData = new FormData(this);
  formData.append("sheet", "Cancellation"); // EXACT sheet name

  // ✅ OFFICE-ID WEB APP URL (FINAL)
  fetch("https://script.google.com/macros/s/AKfycbxtlqg1g6RIlnzEtuBQa3fnnQVb-1ne2Ofu9ymnDr2r5OWbBaL4tXZ_-RsNh4Mnyaji/exec", {
    method: "POST",
    body: formData
  })
    .then(res => res.text())
    .then(() => {
      alert("Booking cancellation submitted successfully");
      this.reset();
      wingSelect.disabled = true;
    })
    .catch(() => {
      alert("Network error. Please check internet connection.");
    });
});
