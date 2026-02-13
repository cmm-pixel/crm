document.addEventListener("DOMContentLoaded", function () {

  const form = document.getElementById("visitForm");
  const submitBtn = document.getElementById("submitBtn");

  const bookingInput = document.getElementById("bookingId");
  const searchBtn = document.getElementById("searchBtn");
  const statusText = document.getElementById("bookingStatus");

  const clientNameInput = document.getElementById("clientName");
  const towerSelect = document.getElementById("tower");
  const wingSelect = document.getElementById("wing");
  const unitInput = document.getElementById("unit");

  const paymentSelect = document.getElementById("payment");
  const paymentSection = document.getElementById("paymentSection");
  const paymentsContainer = document.getElementById("paymentsContainer");
  const addPaymentBtn = document.getElementById("addPaymentBtn");

  const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxtlqg1g6RIlnzEtuBQa3fnnQVb-1ne2Ofu9ymnDr2r5OWbBaL4tXZ_-RsNh4Mnyaji/exec";

  let paymentCount = 0;

  // =====================================
  // Tower → Wing Mapping
  // =====================================
  const wingsByTower = {
    TAPI: ["A Wing"],
    AMAZON: ["A Wing", "B Wing"],
    DANUBE: ["A Wing", "B Wing", "C Wing", "D Wing"]
  };

  function populateWings(towerValue, selectedWing = "") {

    wingSelect.innerHTML = '<option value="">Select</option>';
    wingSelect.disabled = true;

    if (!towerValue || !wingsByTower[towerValue]) return;

    wingsByTower[towerValue].forEach(wing => {
      wingSelect.add(new Option(wing, wing));
    });

    wingSelect.disabled = false;

    if (selectedWing) {
      wingSelect.value = selectedWing;
    }
  }

  towerSelect.addEventListener("change", function () {
    populateWings(this.value);
  });

  // =====================================
  // SEARCH BOOKING
  // =====================================
  function searchBooking() {

    const bookingId = bookingInput.value.trim();
    if (!bookingId) return;

    statusText.textContent = "Searching...";
    statusText.style.color = "#555";
    searchBtn.disabled = true;

    fetch(WEB_APP_URL + "?bookingId=" + encodeURIComponent(bookingId))
      .then(res => res.json())
      .then(data => {

        if (data.error) {
          statusText.textContent = "❌ Booking ID not found";
          statusText.style.color = "red";

          clientNameInput.value = "";
          towerSelect.value = "";
          wingSelect.innerHTML = '<option value="">Select</option>';
          wingSelect.disabled = true;
          unitInput.value = "";
          return;
        }

        clientNameInput.value = data.clientName || "";
        towerSelect.value = (data.tower || "").toUpperCase();
        populateWings(towerSelect.value, data.wing || "");
        unitInput.value = data.unit || "";

        statusText.textContent = "✅ Booking Verified";
        statusText.style.color = "green";
      })
      .catch(() => {
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

  if (searchBtn) {
    searchBtn.addEventListener("click", searchBooking);
  }

  // =====================================
  // MULTIPLE PAYMENT SYSTEM
  // =====================================
  paymentSelect.addEventListener("change", function () {

    if (this.value === "Received") {
      paymentSection.style.display = "block";

      if (paymentCount === 0) {
        addPaymentBlock();
      }
    } else {
      paymentSection.style.display = "none";
      paymentsContainer.innerHTML = "";
      paymentCount = 0;
    }
  });

  function addPaymentBlock() {

    paymentCount++;

    const div = document.createElement("div");
    div.classList.add("payment-block");
    div.style.marginTop = "15px";
    div.style.padding = "15px";
    div.style.border = "1px solid #eee";
    div.style.borderRadius = "4px";

    div.innerHTML = `
      <h4>Payment ${paymentCount}</h4>

      <div class="row">
        <div class="field">
          <label>Date of Payment</label>
          <input type="date" name="paymentDate_${paymentCount}" required>
        </div>

        <div class="field">
          <label>Amount</label>
          <input type="number" name="amount_${paymentCount}" required>
        </div>
      </div>

      <div class="field">
        <label>Mode</label>
        <select name="mode_${paymentCount}" class="mode-select" required>
          <option value="">Select</option>
          <option value="FLAT_COST">Flat Cost</option>
          <option value="IC">IC</option>
          <option value="GST">GST</option>
        </select>
      </div>

      <div class="field">
        <label>Payment Method</label>
        <select name="paymentMethod_${paymentCount}" class="payment-method-select" disabled required>
          <option value="">Select</option>
          <option>IMPS</option>
          <option>NEFT</option>
          <option>UPI</option>
          <option>CHEQUE</option>
        </select>
      </div>

      <div class="field">
        <label>Remark</label>
        <textarea name="remark_${paymentCount}" rows="2"></textarea>
      </div>
    `;

    paymentsContainer.appendChild(div);

    // 🔥 Enable / Disable Logic
    const modeSelect = div.querySelector(".mode-select");
    const paymentMethodSelect = div.querySelector(".payment-method-select");

    modeSelect.addEventListener("change", function () {
      if (this.value === "FLAT_COST" || this.value === "GST") {
        paymentMethodSelect.disabled = false;
      } else {
        paymentMethodSelect.disabled = true;
        paymentMethodSelect.value = "";
      }
    });
  }

  if (addPaymentBtn) {
    addPaymentBtn.addEventListener("click", addPaymentBlock);
  }

  // =====================================
  // FORM SUBMIT
  // =====================================
  form.addEventListener("submit", async function (e) {

    e.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Saving...";

    try {

      const baseData = new FormData(form);

      // 1️⃣ SAVE VISIT
      baseData.append("sheet", "Client_Visit");

      const visitResponse = await fetch(WEB_APP_URL, {
        method: "POST",
        body: baseData
      });

      const visitResult = await visitResponse.text();

      if (visitResult !== "SUCCESS") {
        alert("Error saving visit: " + visitResult);
        throw new Error("Visit save failed");
      }

      // 2️⃣ SAVE PAYMENTS
      if (paymentSelect.value === "Received") {

        for (let i = 1; i <= paymentCount; i++) {

          const paymentData = new FormData();

          paymentData.append("sheet", "Payment_Record");

          paymentData.append("bookingId", baseData.get("bookingId"));
          paymentData.append("clientName", baseData.get("clientName"));
          paymentData.append("tower", baseData.get("tower"));
          paymentData.append("wing", baseData.get("wing"));
          paymentData.append("unit", baseData.get("unit"));
          paymentData.append("rm", baseData.get("rm"));

          paymentData.append("paymentDate", baseData.get(`paymentDate_${i}`));
          paymentData.append("amount", baseData.get(`amount_${i}`));
          paymentData.append("mode", baseData.get(`mode_${i}`));
          paymentData.append("paymentMethod", baseData.get(`paymentMethod_${i}`));
          paymentData.append("remark", baseData.get(`remark_${i}`));

          await fetch(WEB_APP_URL, {
            method: "POST",
            body: paymentData
          });
        }
      }

      alert("Data saved successfully ✅");

      form.reset();
      paymentsContainer.innerHTML = "";
      paymentSection.style.display = "none";
      wingSelect.innerHTML = '<option value="">Select</option>';
      wingSelect.disabled = true;
      paymentCount = 0;
      statusText.textContent = "";

    } catch (error) {
      console.error(error);
      alert("Network or server error");
    }

    submitBtn.disabled = false;
    submitBtn.textContent = "Save Visit";
  });

});
