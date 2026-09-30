// Paste your full Google Apps Script Web App URL here (it ends in /exec).
// Leave it empty to test the page: submissions are simulated and nothing is saved.
const WAITLIST_ENDPOINT = "https://script.google.com/macros/s/AKfycby7nrX23nZ4diedeGaQIt5_g4N8RxoRMpJkRdKt13j_JoFpp9WZM8485p5HeDFwpYLO/exec";

const form = document.getElementById("waitlist-form");
const success = document.getElementById("success");
const submitBtn = document.getElementById("submit-btn");
const resetBtn = document.getElementById("reset-btn");
const formError = document.getElementById("form-error");

const fields = {
  name: document.getElementById("name"),
  email: document.getElementById("email"),
  phone: document.getElementById("phone"),
};

const validators = {
  name: (v) => (v.trim().length >= 2 ? "" : "Please enter your full name."),
  email: (v) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())
      ? ""
      : "Please enter a valid email address.",
  phone: (v) => {
    const cleaned = v.replace(/[\s\-().]/g, "");
    if (cleaned === "") return ""; // optional: empty is fine
    return /^\+?\d{7,15}$/.test(cleaned)
      ? ""
      : "Please enter a valid phone number, e.g. +234 801 234 5678.";
  },
};

function showError(key, message) {
  const input = fields[key];
  document.getElementById(key + "-error").textContent = message;
  input.setAttribute("aria-invalid", message ? "true" : "false");
  if (message) input.setAttribute("aria-describedby", key + "-error");
  else input.removeAttribute("aria-describedby");
}

function validateField(key) {
  const message = validators[key](fields[key].value);
  showError(key, message);
  return !message;
}

Object.keys(fields).forEach((key) => {
  fields[key].addEventListener("blur", () => validateField(key));
  fields[key].addEventListener("input", () => {
    if (fields[key].getAttribute("aria-invalid") === "true") validateField(key);
  });
});

let submitting = false;

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (submitting) return;

  const results = Object.keys(fields).map(validateField);
  if (results.includes(false)) {
    const firstBad = Object.keys(fields).find(
      (k) => fields[k].getAttribute("aria-invalid") === "true",
    );
    fields[firstBad].focus();
    return;
  }

  // Honeypot filled: pretend it worked, send nothing
  if (form.elements.website.value) return showSuccess();

  submitting = true;
  submitBtn.disabled = true;
  submitBtn.textContent = "Joining...";
  formError.textContent = "";

  const payload = {
    name: fields.name.value.trim(),
    email: fields.email.value.trim().toLowerCase(),
    phone: fields.phone.value.replace(/[\s\-().]/g, ""),
    country: form.elements.country.value.trim(),
    source: document.referrer || "direct",
  };

  try {
    if (WAITLIST_ENDPOINT && WAITLIST_ENDPOINT.startsWith("https://")) {
      // "no-cors" means the browser can't read Google's reply, but the data still arrives.
      // If the network is down, fetch throws and the error message below shows.
      await fetch(WAITLIST_ENDPOINT, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      });
    } else {
      console.warn("WAITLIST_ENDPOINT is not set. Simulating signup:", payload);
      await new Promise((r) => setTimeout(r, 800));
    }
    showSuccess();
  } catch (err) {
    console.error(err);
    formError.textContent =
      "Something went wrong. Please check your connection and try again.";
  } finally {
    submitting = false;
    submitBtn.disabled = false;
    submitBtn.textContent = "Join the Waitlist";
  }
});

function showSuccess() {
  form.hidden = true;
  success.hidden = false;
  success.focus();
}

resetBtn.addEventListener("click", () => {
  form.reset();
  Object.keys(fields).forEach((k) => showError(k, ""));
  success.hidden = true;
  form.hidden = false;
  fields.name.focus();
});