/* ================= WING LOGIC ================= */

const wingsByTower = {
  TAPI: ["A Wing"],
  AMAZON: ["A Wing", "B Wing"],
  DANUBE: ["A Wing", "B Wing", "C Wing", "D Wing"]
};

document.querySelectorAll(".tower").forEach((towerSelect, index) => {
  const wingSelect = document.querySelectorAll(".wing")[index];

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
});


/* ================= SAVE BOTH FORMS ================= */

document.getElementById("saveAll").addEventListener("click", function () {
  const salesforceForm = document.getElementById("salesforceForm");
  const clientForm = document.getElementById("clientForm");

  // Validate Salesforce form
  if (!salesforceForm.checkValidity()) {
    salesforceForm.reportValidity();
    return;
  }

  // Validate Client form
  if (!clientForm.checkValidity()) {
    clientForm.reportValidity();
    return;
  }

  // Prepare Salesforce data
  const sfData = new FormData(salesforceForm);
  sfData.append("sheet", "Rectification");
  sfData.append("source", "Salesforce");

  // Prepare Client data
  const clientData = new FormData(clientForm);
  clientData.append("sheet", "Rectification");
  clientData.append("source", "Client");

  // ✅ OFFICE-ID WEB APP URL (FINAL)
  const url =
    "https://script.google.com/macros/s/AKfycbxtlqg1g6RIlnzEtuBQa3fnnQVb-1ne2Ofu9ymnDr2r5OWbBaL4tXZ_-RsNh4Mnyaji/exec";

  // 1️⃣ Save Salesforce row
  fetch(url, { method: "POST", body: sfData })
    .then(() => {
      // 2️⃣ Save Client row
      return fetch(url, { method: "POST", body: clientData });
    })
    .then(() => {
      // 3️⃣ Insert blank row (separator)
      const blankData = new FormData();
      blankData.append("sheet", "Rectification");
      return fetch(url, { method: "POST", body: blankData });
    })
    .then(() => {
      alert("Rectification saved successfully");
      salesforceForm.reset();
      clientForm.reset();
    })
    .catch(() => {
      alert("Network error. Please try again.");
    });
});
