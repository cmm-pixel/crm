document.addEventListener("DOMContentLoaded", function () {

  const WEB_APP_URL =
    "https://script.google.com/macros/s/AKfycbxtlqg1g6RIlnzEtuBQa3fnnQVb-1ne2Ofu9ymnDr2r5OWbBaL4tXZ_-RsNh4Mnyaji/exec";

  const bookingInput = document.getElementById("bookingId");
  const searchBtn = document.getElementById("searchBtn");
  const statusText = document.getElementById("bookingStatus");

  const salesforceForm = document.getElementById("salesforceForm");
  const clientForm = document.getElementById("clientForm");
  const saveBtn = document.getElementById("saveAll");

  if (!salesforceForm || !clientForm) return;

  /* ===================================================
     TOWER → WING LOGIC
  =================================================== */

  const wingsByTower = {
    TAPI: ["A Wing"],
    AMAZON: ["A Wing", "B Wing"],
    DANUBE: ["A Wing", "B Wing", "C Wing", "D Wing"]
  };

  function setupTowerWing(form) {
    const towerSelect = form.querySelector(".tower");
    const wingSelect = form.querySelector(".wing");

    if (!towerSelect || !wingSelect) return;

    towerSelect.addEventListener("change", function () {
      wingSelect.innerHTML = '<option value="">Select</option>';
      wingSelect.disabled = true;

      const towerValue = this.value;

      if (towerValue && wingsByTower[towerValue]) {
        wingsByTower[towerValue].forEach(wing => {
          wingSelect.add(new Option(wing, wing));
        });
        wingSelect.disabled = false;
      }
    });
  }

  setupTowerWing(salesforceForm);
  setupTowerWing(clientForm);

  function populateWings(towerSelect, wingSelect, towerValue, wingValue) {
    wingSelect.innerHTML = '<option value="">Select</option>';
    wingSelect.disabled = true;

    if (!towerValue || !wingsByTower[towerValue]) return;

    wingsByTower[towerValue].forEach(wing => {
      wingSelect.add(new Option(wing, wing));
    });

    wingSelect.disabled = false;
    wingSelect.value = wingValue || "";
  }

  /* ===================================================
     DATE FORMATTER
  =================================================== */

  function formatDateForInput(dateValue) {
    if (!dateValue) return "";

    if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      return dateValue;
    }

    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateValue)) {
      const parts = dateValue.split("/");
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }

    const dateObj = new Date(dateValue);
    if (!isNaN(dateObj)) {
      return dateObj.toISOString().split("T")[0];
    }

    return "";
  }

  /* ===================================================
     NUMBER CLEANER
  =================================================== */

  function cleanNumber(value) {
    if (!value) return "";
    return value.toString().replace(/,/g, "");
  }

  /* ===================================================
     SEARCH BOOKING
  =================================================== */

  function searchBooking() {

    const bookingId = bookingInput.value.trim();
    if (!bookingId) return;

    statusText.textContent = "Searching...";
    statusText.style.color = "#555";
    searchBtn.disabled = true;

    fetch(WEB_APP_URL + "?bookingId=" + encodeURIComponent(bookingId))
      .then(res => {
        if (!res.ok) throw new Error("Network error");
        return res.json();
      })
      .then(data => {

        if (data.error) {
          statusText.textContent = "❌ Booking ID not found";
          statusText.style.color = "red";
          return;
        }

        salesforceForm.querySelector('[name="applicantName"]').value =
          data.clientName || "";

        const towerSelect = salesforceForm.querySelector('[name="tower"]');
        const wingSelect = salesforceForm.querySelector('[name="wing"]');

        const towerValue = (data.tower || "").toUpperCase();
        const wingValue = data.wing || "";

        towerSelect.value = towerValue;
        populateWings(towerSelect, wingSelect, towerValue, wingValue);

        salesforceForm.querySelector('[name="unit"]').value = data.unit || "";
        salesforceForm.querySelector('[name="type"]').value = data.type || "";
        salesforceForm.querySelector('[name="bookingDate"]').value =
          formatDateForInput(data.bookingDate);
        salesforceForm.querySelector('[name="contact"]').value = data.contact || "";
        salesforceForm.querySelector('[name="email"]').value = data.email || "";
        salesforceForm.querySelector('[name="total"]').value =
          cleanNumber(data.total);
        salesforceForm.querySelector('[name="av"]').value =
          cleanNumber(data.av);
        salesforceForm.querySelector('[name="ic"]').value =
          cleanNumber(data.ic);
        salesforceForm.querySelector('[name="paymentPlan"]').value =
          data.paymentPlan || "";

        statusText.textContent = "✅ Booking Found";
        statusText.style.color = "green";
      })
      .catch(err => {
        console.error(err);
        statusText.textContent = "⚠ Server error";
        statusText.style.color = "red";
      })
      .finally(() => {
        searchBtn.disabled = false;
      });
  }

  bookingInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      searchBooking();
    }
  });

  searchBtn.addEventListener("click", searchBooking);

  /* ===================================================
     COPY SINGLE FIELD (Salesforce → Client)
  =================================================== */

  document.querySelectorAll("#clientForm .copy-btn").forEach(btn => {

    btn.addEventListener("click", function () {

      const wrapper = this.closest(".copy-wrapper");
      const clientField = wrapper.querySelector("input, select, textarea");

      const fieldName = clientField.name;

      const salesforceField = salesforceForm.querySelector(
        `[name="${fieldName}"]`
      );

      if (!salesforceField) return;

      // Special handling for Tower
      if (fieldName === "tower") {
        clientField.value = salesforceField.value;
        clientField.dispatchEvent(new Event("change"));
        return;
      }

      // Special handling for Wing
      if (fieldName === "wing") {

        const sfTower = salesforceForm.querySelector('[name="tower"]').value;
        const sfWing = salesforceField.value;

        const clientTower = clientForm.querySelector('[name="tower"]');
        const clientWing = clientField;

        clientTower.value = sfTower;
        clientTower.dispatchEvent(new Event("change"));

        setTimeout(() => {
          clientWing.value = sfWing;
        }, 100);

        return;
      }

      clientField.value = salesforceField.value;
    });

  });

  /* ===================================================
     SAVE BOTH FORMS
  =================================================== */

  saveBtn.addEventListener("click", function () {

    if (!salesforceForm.checkValidity()) {
      salesforceForm.reportValidity();
      return;
    }

    if (!clientForm.checkValidity()) {
      clientForm.reportValidity();
      return;
    }

    const sfData = new FormData(salesforceForm);
    sfData.append("sheet", "Rectification");
    sfData.append("source", "Salesforce");

    const clientData = new FormData(clientForm);
    clientData.append("sheet", "Rectification");
    clientData.append("source", "Client");

    searchBtn.disabled = true;
    saveBtn.disabled = true;
    saveBtn.textContent = "Saving...";

    fetch(WEB_APP_URL, { method: "POST", body: sfData })
      .then(res => res.text())
      .then(result => {

        if (result !== "SUCCESS") {
          throw new Error(result);
        }

        return fetch(WEB_APP_URL, {
          method: "POST",
          body: clientData
        });
      })
      .then(res => res.text())
      .then(result => {

        if (result !== "SUCCESS") {
          throw new Error(result);
        }

        alert("Rectification saved successfully ✅");

        salesforceForm.reset();
        clientForm.reset();
        statusText.textContent = "";
      })
      .catch(err => {
        alert("Error: " + err.message);
      })
      .finally(() => {
        searchBtn.disabled = false;
        saveBtn.disabled = false;
        saveBtn.textContent = "Save Rectification";
      });

  });

});
