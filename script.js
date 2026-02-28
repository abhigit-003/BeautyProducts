/**
 * REFACTORED APP CONTROLLER (ENTRY POINT)
 */
import { STEPS, MAX_FILE_SIZE_BYTES, PORTFOLIO_MAX } from "./js/config.js?v=3";
import { $, $all, showToast, formatLabel } from "./js/utils.js?v=3";
import { persist, hydrate } from "./js/storage.js?v=3";
import { initCustomSelects, renderAadharPreview, populateAgeOptions } from "./js/ui.js?v=3";
import { validationSchema, validateFile } from "./js/validation.js?v=3";
import { serviceApi } from "./js/service-api.js?v=3";

// App State
let currentStep = 1;
const formData = {
  business_type: "",
  categories: [],
  experienceSelect: "",
  certification: null,
  fullName: "",
  ageSelect: "",
  genderSelect: "",
  portfolio: [],
  mobile1: "",
  mobile2: "",
  acceptTerms: false,
  "aadhar-number": "",
  "aadhar-front": null,
  "aadhar-back": null,
};

// --- Initialization ---

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM Content Loaded - Initializing App");
  initApp();
});

// Fallback if DOMContentLoaded already fired (common with modules)
if (document.readyState === "complete" || document.readyState === "interactive") {
  if (!window.__app_initialized) {
    console.log("Direct Initializing (fallback)");
    initApp();
  }
}

function initApp() {
  if (window.__app_initialized) return;
  window.__app_initialized = true;

  updateStepper();
  populateAgeOptions(); // Must happen BEFORE loadDraft so options exist
  loadDraft(); // Load saved state

  bindRoleCards();
  bindCategoryCards();
  bindStepButtons();
  bindFileInputs();
  bindFormInputs();
  bindProgressSteps();

  initCustomSelects((name, value) => {
    formData[name] = value;
    saveDraft();
  });
}

// --- Event Binding ---

function bindRoleCards() {
  $all(".option-card[data-value='service_provider'], .option-card[data-value='destination']").forEach((card) => {
    card.addEventListener("click", () => {
      const type = card.dataset.value;
      formData.business_type = type;
      $all(".option-card[data-value='service_provider'], .option-card[data-value='destination']").forEach((c) => c.classList.remove("active"));
      card.classList.add("active");
      saveDraft();
    });
  });
}

function bindCategoryCards() {
  const cats = ['nailcare', 'haircare', 'henna', 'facial', 'pedimani'];
  $all(".option-card").forEach((card) => {
    if (cats.includes(card.dataset.value)) {
      card.addEventListener("click", () => {
        const cat = card.dataset.value;
        if (formData.categories.includes(cat)) {
          formData.categories = formData.categories.filter((c) => c !== cat);
          card.classList.remove("active");
        } else {
          formData.categories.push(cat);
          card.classList.add("active");
        }
        saveDraft();
      });
    }
  });
}

function bindStepButtons() {
  const nextBtn = $("#next-btn");
  const backBtn = $("#back-btn");

  if (nextBtn) {
    nextBtn.addEventListener("click", async () => {
      console.log("Next Clicked - Current Step:", currentStep);
      if (validateStep(currentStep)) {
        if (currentStep === 4) {
          await finalizeRegistration();
        } else {
          moveNext();
        }
      }
    });
  }

  if (backBtn) {
    backBtn.addEventListener("click", () => {
      console.log("Back Clicked");
      moveBack();
    });
  }

  const saveBtn = $("#save-draft-btn");
  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      saveDraft();
      showToast("Draft saved successfully.");
    });
  }
}

function bindProgressSteps() {
  $all(".step-list li").forEach((li) => {
    li.style.cursor = "pointer";
    li.addEventListener("click", () => {
      const target = parseInt(li.dataset.step);
      if (target < currentStep) {
        currentStep = target;
        updateStepper();
      }
    });
  });
}

function bindFormInputs() {
  const m1 = $("#mobile1");
  const m2 = $("#mobile2");
  if (m1) m1.addEventListener("input", (e) => { formData.mobile1 = e.target.value; saveDraft(); });
  if (m2) m2.addEventListener("input", (e) => { formData.mobile2 = e.target.value; saveDraft(); });

  const fn = $("#fullName");
  if (fn) fn.addEventListener("input", (e) => { formData.fullName = e.target.value; saveDraft(); });

  const termsCb = $("#acceptTerms");
  if (termsCb) termsCb.addEventListener("change", (e) => { formData.acceptTerms = e.target.checked; saveDraft(); });

  const aadharNum = $("#aadhar-number");
  if (aadharNum) aadharNum.addEventListener("input", (e) => { formData["aadhar-number"] = e.target.value; saveDraft(); });
}

function bindFileInputs() {
  const certInput = $("#certification");
  if (certInput) certInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const check = validateFile(file);
      if (!check.valid) { showToast(check.error); certInput.value = ""; return; }
      formData.certification = file;
      renderCertificationPreview(file);
    }
  });

  const portfolioInput = $("#portfolio");
  if (portfolioInput) portfolioInput.addEventListener("change", (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      if (formData.portfolio.length >= PORTFOLIO_MAX) return;
      if (!validateFile(file).valid) return;
      formData.portfolio.push(file);
    });
    renderPortfolioPreviews();
    portfolioInput.value = "";
  });

  const aadharFront = $("#aadhar-front");
  if (aadharFront) aadharFront.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file && validateFile(file).valid) {
      formData["aadhar-front"] = file;
      renderAadharPreview("front", file, () => {
        formData["aadhar-front"] = null;
        renderAadharPreview("front", null);
      });
    }
  });

  const aadharBack = $("#aadhar-back");
  if (aadharBack) aadharBack.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file && validateFile(file).valid) {
      formData["aadhar-back"] = file;
      renderAadharPreview("back", file, () => {
        formData["aadhar-back"] = null;
        renderAadharPreview("back", null);
      });
    }
  });
}

// --- Core App Logic ---

function moveNext() {
  if (currentStep < 4) {
    currentStep++;
    updateStepper();
    if (currentStep === 3) renderReviewStep();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

function moveBack() {
  if (currentStep > 1) {
    currentStep--;
    updateStepper();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

function updateStepper() {
  console.log("Updating UI to Step:", currentStep);
  $all(".step").forEach((step) => {
    const s = parseInt(step.id.split("-")[1]);
    step.classList.toggle("active", s === currentStep);
  });

  $all(".step-list li").forEach((li) => {
    const s = parseInt(li.dataset.step);
    li.classList.toggle("active", s === currentStep);
    li.classList.toggle("completed", s < currentStep);

    if (s === currentStep) {
      li.setAttribute("aria-current", "step");
    } else {
      li.removeAttribute("aria-current");
    }
  });

  const fill = $("#progress-fill");
  if (fill) fill.style.width = `${(currentStep / 4) * 100}%`;

  const count = $("#step-count");
  if (count) count.textContent = `Step ${currentStep} of 4`;

  const title = $("#step-title");
  if (title) {
    const titles = ["Basic Information", "Portfolio & Contact", "Review & Terms", "Aadhar Verification"];
    title.textContent = titles[currentStep - 1] || "Registration";
  }

  const nextBtn = $("#next-btn");
  if (nextBtn) {
    nextBtn.textContent = currentStep === 4 ? "Submit" : "Next step";
  }
}

function validateStep(stepId) {
  const schema = validationSchema[stepId];
  if (!schema) return true;

  const errors = schema.validate(formData);

  $all(".field-error").forEach(el => el.textContent = "");
  $all(".form-field").forEach(el => el.classList.remove("error"));

  if (Object.keys(errors).length > 0) {
    console.warn("Validation failed for step", stepId, errors);
    Object.entries(errors).forEach(([field, msg]) => {
      showStepError(stepId, field, msg);
    });
    const firstError = $(".form-field.error");
    if (firstError) firstError.scrollIntoView({ behavior: "smooth", block: "center" });
    return false;
  }
  return true;
}

function showStepError(stepId, fieldId, message) {
  const errorEl = $(`[data-error-for="${fieldId}"]`);
  if (errorEl) {
    errorEl.textContent = message;
    const field = errorEl.closest(".form-field");
    if (field) field.classList.add("error");
  } else {
    showToast(message);
  }
}

async function finalizeRegistration() {
  try {
    const btn = $("#next-btn");
    btn.disabled = true;
    btn.textContent = "Submitting...";

    const response = await serviceApi.submitRegistration(formData);

    if (response.success) {
      showToast(response.message);
      localStorage.removeItem("registration_draft");
      setTimeout(() => {
        location.reload();
      }, 2000);
    }
  } catch (error) {
    showToast(error.message || "Submission failed.");
    const btn = $("#next-btn");
    btn.disabled = false;
    btn.textContent = "Complete Registration";
  }
}

// --- Specialized UI Renders ---

function renderCertificationPreview(file) {
  const preview = $("#certificationPreview");
  if (!preview) return;
  preview.innerHTML = `<span class="file-name">${file.name} (Ready)</span>`;
  preview.classList.remove("hidden");
}

function renderPortfolioPreviews() {
  const container = $("#portfolioPreview");
  if (!container) return;
  container.innerHTML = "";
  formData.portfolio.forEach((file, index) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const thumb = document.createElement("div");
      thumb.className = "portfolio-thumb";
      thumb.innerHTML = `
        <img src="${e.target.result}" alt="Portfolio ${index + 1}">
        <button class="remove-thumb" data-index="${index}">×</button>
      `;
      thumb.querySelector(".remove-thumb").onclick = () => {
        formData.portfolio.splice(index, 1);
        renderPortfolioPreviews();
        saveDraft();
      };
      container.appendChild(thumb);
    };
    reader.readAsDataURL(file);
  });
}

function renderReviewStep() {
  const profile = $("#reviewProfile");
  if (profile) {
    profile.innerHTML = `
      <dt>Role</dt><dd>${formatLabel(formData.business_type)}</dd>
      <dt>Experience</dt><dd>${formData.experienceSelect || 'Not selected'} years</dd>
      <dt>Name</dt><dd>${formData.fullName}</dd>
      <dt>Age & Gender</dt><dd>${formData.ageSelect} / ${formatLabel(formData.genderSelect)}</dd>
    `;
  }
  const services = $("#reviewServices");
  if (services) {
    services.innerHTML = `<dt>Categories</dt><dd>${formData.categories.map(c => formatLabel(c)).join(", ") || "None selected"}</dd>`;
  }
  const contact = $("#reviewContact");
  if (contact) {
    contact.innerHTML = `<dt>Phone</dt><dd>${formData.mobile1}${formData.mobile2 ? " / " + formData.mobile2 : ""}</dd>`;
  }
  const portThumbs = $("#reviewPortfolioThumbs");
  const portCount = $("#reviewPortfolioCount");
  if (portThumbs && portCount) {
    portThumbs.innerHTML = "";
    portCount.textContent = `${formData.portfolio.length} images`;
    formData.portfolio.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement("img");
        img.src = e.target.result;
        portThumbs.appendChild(img);
      };
      reader.readAsDataURL(file);
    });
  }
}

// --- Persistence ---

function saveDraft() {
  const draftData = { ...formData };
  delete draftData.certification;
  delete draftData.portfolio;
  delete draftData["aadhar-front"];
  delete draftData["aadhar-back"];
  persist("registration_draft", { currentStep: parseInt(currentStep), data: draftData });
}

function loadDraft() {
  const saved = hydrate("registration_draft");
  if (saved) {
    currentStep = parseInt(saved.currentStep) || 1;
    Object.assign(formData, saved.data);

    if (formData.business_type) {
      const card = $(`.option-card[data-value="${formData.business_type}"]`);
      if (card) card.classList.add("active");
    }
    formData.categories.forEach(cat => {
      const card = $(`.option-card[data-value="${cat}"]`);
      if (card) card.classList.add("active");
    });

    if ($("#fullName")) $("#fullName").value = formData.fullName || "";
    if ($("#mobile1")) $("#mobile1").value = formData.mobile1 || "";
    if ($("#mobile2")) $("#mobile2").value = formData.mobile2 || "";
    if ($("#aadhar-number")) $("#aadhar-number").value = formData["aadhar-number"] || "";
    if ($("#acceptTerms")) $("#acceptTerms").checked = formData.acceptTerms || false;

    ["experienceSelect", "ageSelect", "genderSelect"].forEach(id => {
      const el = $(`#${id}`);
      if (el && formData[id]) el.value = formData[id];
    });
  }
}
