// =============================
// Auto Search + Submit Logic
// =============================
document.addEventListener("DOMContentLoaded", function () {

  const bookingInput = document.getElementById("bookingId");
  const searchBtn = document.getElementById("searchBtn");
  const statusText = document.getElementById("bookingStatus");

  const clientNameInput = document.getElementById("clientName");
  const towerInput = document.getElementById("tower");
  const wingInput = document.getElementById("wing");
  const unitInput = document.getElementById("unit");

  const form = document.getElementById("callForm");
  const submitBtn = document.getElementById("submitBtn");


  const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxtlqg1g6RIlnzEtuBQa3fnnQVb-1ne2Ofu9ymnDr2r5OWbBaL4tXZ_-RsNh4Mnyaji/exec";

  // =============================
  // SEARCH FUNCTION (Reusable)
  // =============================
  function searchBooking() {

    const bookingId = bookingInput.value.trim();
    if (!bookingId) return;

    statusText.textContent = "Searching...";
    statusText.style.color = "#555";

    if (searchBtn) searchBtn.disabled = true;

    fetch(WEB_APP_URL + "?bookingId=" + encodeURIComponent(bookingId))
      .then(res => res.json())
      .then(data => {

        if (data.error) {

          statusText.textContent = "❌ Booking ID not found";
          statusText.style.color = "red";

          clientNameInput.value = "";
          towerInput.value = "";
          wingInput.value = "";
          unitInput.value = "";
          return;
        }

        clientNameInput.value = data.clientName || "";
        towerInput.value = data.tower || "";
        wingInput.value = data.wing || "";
        unitInput.value = data.unit || "";

        statusText.textContent = "✅ Booking Verified";
        statusText.style.color = "green";
      })
      .catch(err => {
        console.error("Search Error:", err);
        statusText.textContent = "⚠ Server error";
        statusText.style.color = "red";
      })
      .finally(() => {
        if (searchBtn) searchBtn.disabled = false;
      });
  }

  // =============================
  // ENTER KEY SEARCH
  // =============================
  bookingInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      searchBooking();
    }
  });

  // =============================
  // SEARCH BUTTON CLICK
  // =============================
  if (searchBtn) {
    searchBtn.addEventListener("click", function () {
      searchBooking();
    });
  }

  // =============================
  // FORM SUBMIT
  // =============================
  form.addEventListener("submit", function (e) {

    e.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const formData = new FormData(form);
    formData.set("visitDate", formData.get("visitDate") || "");
    formData.set("visitTime", formData.get("visitTime") || "");
    formData.append("sheet", "Call_Log");

    submitBtn.disabled = true;
    submitBtn.textContent = "Saving...";

    fetch(WEB_APP_URL, {
      method: "POST",
      body: formData
    })
      .then(response => response.text())
      .then(data => {

        if (data === "SAME_DAY_DUPLICATE") {
          alert("⚠ This Booking ID already has an entry today.");
          bookingInput.focus();
          return;
        }

        if (data === "SUCCESS") {
          alert("Call log saved successfully");
          form.reset();
          statusText.textContent = "";
          return;
        }

        if (data.startsWith("ERROR")) {
          alert("Server Error: " + data);
          return;
        }

        alert("Unexpected server response: " + data);
      })
      .catch(error => {
        console.error("Network Error:", error);
        alert("Failed to save. Please check internet connection.");
      })
      .finally(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = "Save Call Log";
      });

  });

});
