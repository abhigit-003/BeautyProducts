const STEPS = [
  {
    id: 1,
    title: "Basic Information",
    subtitle: "Business type, categories, experience, optional certification, and personal details (Name, Age, Gender).",
  },
  {
    id: 2,
    title: "Portfolio & Contact",
    subtitle: "Upload portfolio images and enter up to two mobile numbers for contact.",
  },
  {
    id: 3,
    title: "Review & Terms",
    subtitle: "Preview all your information, agree to terms and conditions, and submit.",
  },
  {
    id: 4,
    title: "Aadhar Verification",
    subtitle: "Identity verification with Aadhar number and card image uploads.",
  },
];

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

let currentStep = 1;
const formData = {
  basic: {},
  contact: {},
  files: {
    certification: null,
    portfolio: [],
    aadharFront: null,
    aadharBack: null,
  },
};

function $(selector) {
  return document.querySelector(selector);
}

function $all(selector) {
  return Array.from(document.querySelectorAll(selector));
}

function init() {
  bindControls();
  updateStepUI();
  populateAgeSelect();
  initCustomSelects();
  bindRoleCards();
  bindCategoryCards();
  bindSelectPersistence();
  bindFileInputs();
  renderPortfolioPreviews();
  renderCertificationPreview();
  bindDropZones();
  bindAadharInput();
  bindTermsCheckbox();
  bindStepNavigation();
  hydrateFromLocalStorage();
}

function populateAgeSelect() {
  const ageSelect = $("#ageSelect");
  if (!ageSelect) return;
  if (ageSelect.options.length > 1) return;
  for (let age = 18; age <= 80; age += 1) {
    const opt = document.createElement("option");
    opt.value = String(age);
    opt.textContent = String(age);
    ageSelect.appendChild(opt);
  }
}

function initCustomSelects() {
  const ids = ["ageSelect", "genderSelect", "experienceSelect"];
  ids.forEach((id) => {
    const select = document.getElementById(id);
    if (!select || select.closest(".custom-select-wrap")) return;
    const wrap = document.createElement("div");
    wrap.className = "custom-select-wrap";
    const trigger = document.createElement("div");
    trigger.className = "custom-select-trigger";
    trigger.setAttribute("aria-hidden", "true");
    const list = document.createElement("div");
    list.className = "custom-select-list";
    list.setAttribute("role", "listbox");
    select.parentNode.insertBefore(wrap, select);
    wrap.appendChild(select);
    wrap.appendChild(trigger);
    wrap.appendChild(list);
    function updateTrigger() {
      const opt = select.options[select.selectedIndex];
      trigger.textContent = opt ? opt.textContent : select.querySelector("option[value='']")?.textContent || "Select…";
    }
    for (let i = 0; i < select.options.length; i++) {
      const opt = select.options[i];
      const item = document.createElement("div");
      item.className = "custom-select-option";
      item.textContent = opt.textContent;
      item.dataset.value = opt.value;
      item.setAttribute("role", "option");
      item.addEventListener("click", () => {
        select.value = opt.value;
        updateTrigger();
        wrap.classList.remove("open");
        select.dispatchEvent(new Event("change", { bubbles: true }));
      });
      list.appendChild(item);
    }
    updateTrigger();
    trigger.setAttribute("tabindex", "0");
    trigger.setAttribute("role", "combobox");
    trigger.setAttribute("aria-haspopup", "listbox");

    trigger.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleSelect();
    });

    trigger.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleSelect();
      } else if (e.key === "Escape") {
        wrap.classList.remove("open", "open-up");
      }
    });

    function toggleSelect() {
      $all(".custom-select-wrap.open").forEach((w) => {
        if (w !== wrap) w.classList.remove("open", "open-up");
      });
      wrap.classList.toggle("open");
      wrap.classList.remove("open-up");
      if (wrap.classList.contains("open")) {
        requestAnimationFrame(() => {
          const triggerRect = trigger.getBoundingClientRect();
          const listHeight = list.offsetHeight;
          const spaceBelow = window.innerHeight - triggerRect.bottom;
          if (spaceBelow < listHeight && triggerRect.top >= listHeight) {
            wrap.classList.add("open-up");
          }
        });
      }
    }
    document.addEventListener("click", (e) => {
      if (!wrap.contains(e.target)) wrap.classList.remove("open", "open-up");
    });
  });
}

function bindRoleCards() {
  const container = $("#roleCards");
  const input = $("#roleInput");
  if (!container || !input) return;

  container.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const value = btn.getAttribute("data-value");
    if (!value) return;

    input.value = value;
    container.querySelectorAll("button").forEach((b) => {
      b.classList.toggle("active", b === btn);
    });

    clearError("roleInput");
    persist();
  });
}

function bindCategoryCards() {
  const container = $("#categoriesCards");
  const input = $("#categoriesInput");
  if (!container || !input) return;

  container.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const value = btn.getAttribute("data-value");
    if (!value) return;

    btn.classList.toggle("active");
    const selected = Array.from(container.querySelectorAll("button.active")).map(
      (b) => b.getAttribute("data-value")
    );
    input.value = selected.join(",");
    if (selected.length > 0) clearError("categoriesInput");
    persist();
  });
}

function bindSelectPersistence() {
  const ids = ["ageSelect", "genderSelect", "experienceSelect"];
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("change", () => {
      clearError(id);
      persist();
    });
  });

  const fullName = $("#fullName");
  if (fullName) {
    fullName.addEventListener("input", () => {
      clearError("fullName");
      persist();
    });
  }
}

function bindControls() {
  const backBtn = $("#backBtn");
  const nextBtn = $("#nextBtn");
  const saveDraftBtn = $("#saveDraftBtn");

  backBtn.addEventListener("click", () => {
    if (currentStep > 1) {
      currentStep -= 1;
      updateStepUI();
    }
  });

  nextBtn.addEventListener("click", () => {
    handleNext();
  });

  saveDraftBtn.addEventListener("click", () => {
    saveDraft();
  });
}

function handleNext() {
  if (!validateStep(currentStep)) {
    return;
  }

  if (currentStep === 2) {
    populateReview();
  }

  if (currentStep < STEPS.length) {
    currentStep += 1;
    updateStepUI();
    updateProgressIncomplete([]);
    if (currentStep === 3) {
      populateReview();
    }
    persist();
  } else {
    const { valid, failedSteps } = validateAllSteps();
    if (!valid) {
      updateProgressIncomplete(failedSteps);
      showToast("Complete the missing sections marked in the progress list.");
      validateStep(currentStep, false);
      return;
    }
    updateProgressIncomplete([]);
    try {
      localStorage.removeItem("providerRegistrationDraft");
    } catch (_) { }
    showToast("Registration submitted successfully. (Demo: no data sent to server)");
  }
}

function updateStepUI() {
  $all(".step").forEach((stepEl) => {
    const id = Number(stepEl.id.replace("step-", ""));
    stepEl.classList.toggle("active", id === currentStep);
  });

  const stepMeta = STEPS.find((s) => s.id === currentStep);
  $("#step-title").textContent = stepMeta.title;
  const subEl = $("#step-subtitle");
  if (subEl) subEl.textContent = stepMeta.subtitle;
  $("#step-count").textContent = `Step ${currentStep} of ${STEPS.length}`;

  const progress = (currentStep / STEPS.length) * 100;
  $("#progress-fill").style.width = `${progress}%`;

  $all(".step-list li").forEach((li) => {
    const stepId = Number(li.getAttribute("data-step"));
    li.classList.toggle("active", stepId === currentStep);
    li.classList.toggle("completed", isStepComplete(stepId));
  });

  if (currentStep === 3) {
    populateReview();
  }

  const backBtn = $("#backBtn");
  const nextBtn = $("#nextBtn");

  backBtn.disabled = currentStep === 1;
  nextBtn.textContent = currentStep === STEPS.length ? "Submit" : "Next step";
}

function bindStepNavigation() {
  $all(".step-list li").forEach((li) => {
    li.addEventListener("click", () => {
      const targetStep = Number(li.getAttribute("data-step"));
      if (!targetStep || targetStep === currentStep) return;

      currentStep = targetStep;
      if (currentStep === 3) {
        populateReview();
      }
      updateStepUI();
    });
  });
}

function bindDropZones() {
  $all(".drop-zone").forEach((zone) => {
    const input = zone.querySelector('input[type="file"]');
    if (!input) return;

    const setDrag = (on) => zone.classList.toggle("dragover", on);

    zone.addEventListener("dragover", (e) => {
      e.preventDefault();
      setDrag(true);
    });

    zone.addEventListener("dragleave", () => setDrag(false));
    zone.addEventListener("drop", (e) => {
      e.preventDefault();
      setDrag(false);

      const files = Array.from(e.dataTransfer?.files || []);
      if (files.length === 0) return;

      const dt = new DataTransfer();
      files.forEach((f) => dt.items.add(f));
      input.files = dt.files;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
  });
}

const PORTFOLIO_MAX = 10;

function createThumb(file, small) {
  const thumb = document.createElement("div");
  thumb.className = `thumb${small ? " small" : ""}`;

  const img = document.createElement("img");
  const label = document.createElement("div");
  label.className = "thumb-label";
  label.textContent = file.name || "Preview";

  if (file.previewUrl) {
    img.src = file.previewUrl;
  } else {
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  thumb.appendChild(img);
  thumb.appendChild(label);
  return thumb;
}

function renderPortfolioPreviews() {
  const container = $("#portfolioPreview");
  const input = $("#portfolio");
  if (!container) return;
  const list = formData.files.portfolio || [];
  container.innerHTML = "";
  list.forEach((file, index) => {
    const thumb = createThumb(file, false);
    thumb.classList.add("thumb-removable");
    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "thumb-remove";
    removeBtn.setAttribute("aria-label", "Remove image");
    removeBtn.textContent = "×";
    removeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      formData.files.portfolio.splice(index, 1);
      renderPortfolioPreviews();
      if (list.length <= 1) clearError("portfolio");
      persist();
    });
    thumb.appendChild(removeBtn);
    container.appendChild(thumb);
  });
  if (list.length < PORTFOLIO_MAX && input) {
    const addMore = document.createElement("button");
    addMore.type = "button";
    addMore.className = "add-more-portfolio";
    addMore.textContent = list.length === 0 ? "Add image" : "Add another image";
    addMore.addEventListener("click", () => input.click());
    container.appendChild(addMore);
  }
}

function renderCertificationPreview() {
  const container = $("#certificationPreview");
  const input = $("#certification");
  if (!container) return;
  const file = formData.files.certification;
  container.innerHTML = "";
  if (file) {
    const wrap = document.createElement("div");
    wrap.className = "certification-file-row";
    const name = document.createElement("span");
    name.className = "certification-file-name";
    name.textContent = file.name || "Certificate";
    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "certification-remove";
    removeBtn.textContent = "Remove";
    removeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      formData.files.certification = null;
      if (input) input.value = "";
      renderCertificationPreview();
      persist();
    });
    wrap.appendChild(name);
    wrap.appendChild(removeBtn);
    container.appendChild(wrap);
  }
}

function bindFileInputs() {
  const fileConfig = [
    { id: "portfolio", multiple: true, previewId: "portfolioPreview" },
    { id: "aadharFront", multiple: false, previewId: "aadharFrontPreview" },
    { id: "aadharBack", multiple: false, previewId: "aadharBackPreview" },
    { id: "certification", multiple: false, previewId: null },
  ];

  fileConfig.forEach(({ id, multiple, previewId }) => {
    const input = document.getElementById(id);
    if (!input) return;

    input.addEventListener("change", () => {
      const files = Array.from(input.files || []);
      const oversizedFiles = files.filter(f => f.size > MAX_FILE_SIZE_BYTES);

      if (oversizedFiles.length > 0) {
        setError(id, `File(s) exceed ${MAX_FILE_SIZE_MB}MB limit.`);
        input.value = "";
        return;
      }

      if (id === "portfolio") {
        const existing = formData.files.portfolio || [];
        const combined = [...existing, ...files].slice(0, PORTFOLIO_MAX);
        formData.files.portfolio = combined;
        if (previewId) renderPortfolioPreviews();
        input.value = "";
      } else if (id === "aadharFront") {
        formData.files.aadharFront = files[0] || null;
      } else if (id === "aadharBack") {
        formData.files.aadharBack = files[0] || null;
      } else if (id === "certification") {
        formData.files.certification = files[0] || null;
        renderCertificationPreview();
      }

      if (previewId && id !== "portfolio") {
        const container = document.getElementById(previewId);
        container.innerHTML = "";
        files.forEach((file) => {
          const thumb = createThumb(file, previewId.includes("review"));
          container.appendChild(thumb);
        });
      }

      if (id === "portfolio" && files.length > 0) clearError("portfolio");
      if (id === "aadharFront" && files[0]) clearError("aadharFront");
      if (id === "aadharBack" && files[0]) clearError("aadharBack");

      persist();
    });
  });
}

function bindTermsCheckbox() {
  const el = $("#acceptTerms");
  if (el) el.addEventListener("change", () => persist());
}

function bindAadharInput() {
  const input = $("#aadharNumber");
  input.addEventListener("input", () => {
    let value = input.value.replace(/\D/g, "").slice(0, 12);
    if (value.length > 4 && value.length <= 8) {
      value = `${value.slice(0, 4)} ${value.slice(4)}`;
    } else if (value.length > 8) {
      value = `${value.slice(0, 4)} ${value.slice(4, 8)} ${value.slice(8)}`;
    }
    input.value = value;
    clearError("aadharNumber");
    persist();
  });
}

function validateStep(step, silent) {
  let valid = true;

  const setStepError = silent
    ? () => { valid = false; }
    : (fieldId, message) => {
      setError(fieldId, message);
      valid = false;
    };

  if (!silent) {
    document
      .querySelectorAll(`#step-${step} .field-error`)
      .forEach((el) => (el.textContent = ""));
  }

  if (step === 1) {
    const categories = $("#categoriesInput").value.trim();
    const role = $("#roleInput").value.trim();
    const fullName = $("#fullName").value.trim();
    const age = $("#ageSelect").value.trim();
    const gender = $("#genderSelect").value.trim();
    const experience = $("#experienceSelect").value.trim();

    if (!role) setStepError("roleInput", "Please select a role.");
    if (!categories)
      setStepError("categoriesInput", "Select at least one service category.");
    if (!fullName) setStepError("fullName", "Name is required.");
    if (!age) setStepError("ageSelect", "Please select your age.");
    if (!gender) setStepError("genderSelect", "Please select your gender.");
    if (!experience) setStepError("experienceSelect", "Please select your experience.");

    if (valid) {
      formData.basic = {
        role,
        categories: categories.split(","),
        fullName,
        age: Number(age),
        gender,
        experience,
      };
      persist();
    }
  } else if (step === 2) {
    const mobile1 = $("#mobile1").value.trim();
    const mobile2 = $("#mobile2").value.trim();
    const portfolioFiles = formData.files.portfolio;

    const mobileRegex = /^[6-9]\d{9}$/;

    if (!mobileRegex.test(mobile1)) {
      setStepError("mobile1", "Enter a valid 10-digit Indian mobile number.");
    }

    if (mobile2 && !mobileRegex.test(mobile2)) {
      setStepError("mobile1", "");
      setStepError("mobile2", "If provided, this must be a valid 10-digit number.");
    }

    if (!portfolioFiles || portfolioFiles.length < 1) {
      setStepError("portfolio", "Upload at least one portfolio image.");
    }

    if (valid) {
      formData.contact = { mobile1, mobile2 };
      persist();
    }
  } else if (step === 3) {
    const acceptTerms = $("#acceptTerms").checked;
    if (!acceptTerms) {
      setStepError("acceptTerms", "You need to accept the terms to continue.");
    }
  } else if (step === 4) {
    const aadhar = $("#aadharNumber").value.replace(/\s/g, "");
    const front = formData.files.aadharFront;
    const back = formData.files.aadharBack;

    if (aadhar.length !== 12) {
      setStepError("aadharNumber", "Enter a valid 12-digit Aadhar number.");
    }
    if (!front) {
      setStepError("aadharFront", "Upload the front side of your Aadhar card.");
    }
    if (!back) {
      setStepError("aadharBack", "Upload the back side of your Aadhar card.");
    }
  }

  return valid;
}

function isStepComplete(step) {
  if (step === 1) {
    const role = $("#roleInput")?.value?.trim();
    const categories = $("#categoriesInput")?.value?.trim();
    const fullName = $("#fullName")?.value?.trim();
    const age = $("#ageSelect")?.value?.trim();
    const gender = $("#genderSelect")?.value?.trim();
    const experience = $("#experienceSelect")?.value?.trim();
    return !!(role && categories && fullName && age && gender && experience);
  }
  if (step === 2) {
    const mobile1 = $("#mobile1")?.value?.trim() || "";
    const mobile2 = $("#mobile2")?.value?.trim() || "";
    const portfolio = formData.files.portfolio;
    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(mobile1)) return false;
    if (mobile2 && !mobileRegex.test(mobile2)) return false;
    return !!(portfolio && portfolio.length >= 1);
  }
  if (step === 3) {
    return !!($("#acceptTerms")?.checked);
  }
  if (step === 4) {
    const aadhar = ($("#aadharNumber")?.value || "").replace(/\s/g, "");
    return aadhar.length === 12 && !!formData.files.aadharFront && !!formData.files.aadharBack;
  }
  return false;
}

function refreshProgressTicks() {
  $all(".step-list li").forEach((li) => {
    const stepId = Number(li.getAttribute("data-step"));
    li.classList.toggle("completed", isStepComplete(stepId));
  });
}

function validateAllSteps() {
  const failedSteps = [];
  for (let s = 1; s <= STEPS.length; s++) {
    if (!validateStep(s, true)) failedSteps.push(s);
  }
  return { valid: failedSteps.length === 0, failedSteps };
}

function updateProgressIncomplete(failedSteps) {
  $all(".step-list li").forEach((li) => {
    const stepId = Number(li.getAttribute("data-step"));
    li.classList.toggle("incomplete", failedSteps.includes(stepId));
  });
}

function setError(fieldId, message) {
  const errorEl = document.querySelector(`[data-error-for="${fieldId}"]`);
  if (errorEl) errorEl.textContent = message;
}

function clearError(fieldId) {
  const errorEl = document.querySelector(`[data-error-for="${fieldId}"]`);
  if (errorEl) errorEl.textContent = "";
}

function populateReview() {
  const profileList = $("#reviewProfile");
  const servicesList = $("#reviewServices");
  const contactList = $("#reviewContact");
  const portfolioThumbs = $("#reviewPortfolioThumbs");
  const portfolioCount = $("#reviewPortfolioCount");

  profileList.innerHTML = "";
  servicesList.innerHTML = "";
  contactList.innerHTML = "";
  portfolioThumbs.innerHTML = "";

  const { basic, contact } = formData;

  const addRow = (container, label, value) => {
    const dt = document.createElement("dt");
    dt.textContent = label;
    const dd = document.createElement("dd");
    dd.textContent = value || "–";
    container.appendChild(dt);
    container.appendChild(dd);
  };

  if (basic) {
    addRow(profileList, "Full name", basic.fullName);
    addRow(profileList, "Age", basic.age ? `${basic.age} years` : "–");
    addRow(profileList, "Gender", formatLabel(basic.gender));
    addRow(profileList, "Role", formatLabel(basic.role));

    addRow(
      servicesList,
      "Service categories",
      (basic.categories || []).map(formatLabel).join(", ")
    );
    addRow(
      servicesList,
      "Experience",
      basic.experience ? `${basic.experience}${basic.experience === "1" ? " year" : " years"}` : "–"
    );
  }

  if (contact) {
    addRow(contactList, "Primary mobile", contact.mobile1 || "–");
    addRow(contactList, "Secondary mobile", contact.mobile2 || "Not provided");
  }

  const portfolioFiles = formData.files.portfolio || [];
  portfolioFiles.forEach((file) => {
    const thumb = createThumb(file, true);
    portfolioThumbs.appendChild(thumb);
  });

  portfolioCount.textContent =
    portfolioFiles.length > 0 ? `${portfolioFiles.length} image(s)` : "No images";
}

function formatLabel(value) {
  if (!value) return "";
  const mapping = {
    nailcare: "Nailcare",
    haircare: "Haircare",
    henna: "Henna",
    facial: "Facial",
    pedimani: "Pedi/Mani",
    service_provider: "Service Provider",
    destination: "Destination",
    female: "Female",
    male: "Male",
    nonbinary: "Non-binary",
    prefer_not: "Prefer not to say",
  };
  return mapping[value] || value;
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("visible");
  setTimeout(() => {
    toast.classList.remove("visible");
  }, 2600);
}

function persist() {
  refreshProgressTicks();
  try {
    const draft = {
      step: currentStep,
      basic: {
        role: $("#roleInput")?.value || "",
        categories: ($("#categoriesInput")?.value || "").split(",").filter(Boolean) || [],
        fullName: $("#fullName")?.value ?? "",
        age: $("#ageSelect")?.value ?? "",
        gender: $("#genderSelect")?.value ?? "",
        experience: $("#experienceSelect")?.value ?? "",
      },
      contact: {
        mobile1: $("#mobile1")?.value ?? "",
        mobile2: $("#mobile2")?.value ?? "",
      },
      termsAccepted: $("#acceptTerms")?.checked ?? false,
      aadhar: $("#aadharNumber")?.value ?? "",
    };
    localStorage.setItem("providerRegistrationDraft", JSON.stringify(draft));
  } catch {
    // ignore
  }
}

function hydrateFromLocalStorage() {
  try {
    const raw = localStorage.getItem("providerRegistrationDraft");
    if (!raw) return;
    const draft = JSON.parse(raw);

    if (draft.basic) {
      $("#categoriesInput").value = (draft.basic.categories || []).join(",");
      $("#fullName").value = draft.basic.fullName || "";
      const ageSelect = $("#ageSelect");
      if (ageSelect) ageSelect.value = draft.basic.age || "";
      $("#genderSelect").value = draft.basic.gender || "";
      $("#experienceSelect").value = draft.basic.experience || "";
      $("#roleInput").value = draft.basic.role || "";

      if (draft.basic.role) {
        const btn = document.querySelector(
          `#roleCards button[data-value="${draft.basic.role}"]`
        );
        if (btn) btn.classList.add("active");
      }

      (draft.basic.categories || []).forEach((cat) => {
        const btn = document.querySelector(
          `#categoriesCards button[data-value="${cat}"]`
        );
        if (btn) btn.classList.add("active");
      });

      formData.basic = {
        role: draft.basic.role || "",
        categories: Array.isArray(draft.basic.categories) ? draft.basic.categories : [],
        fullName: draft.basic.fullName || "",
        age: draft.basic.age,
        gender: draft.basic.gender || "",
        experience: draft.basic.experience || "",
      };
    }

    if (draft.contact) {
      $("#mobile1").value = draft.contact.mobile1 || "";
      $("#mobile2").value = draft.contact.mobile2 || "";
      formData.contact = {
        mobile1: draft.contact.mobile1 || "",
        mobile2: draft.contact.mobile2 || "",
      };
    }

    if (typeof draft.termsAccepted === "boolean") {
      $("#acceptTerms").checked = draft.termsAccepted;
    }

    if (draft.aadhar) {
      $("#aadharNumber").value = draft.aadhar;
    }

    if (draft.step && draft.step >= 1 && draft.step <= STEPS.length) {
      currentStep = draft.step;
    }

    updateStepUI();

    $all(".custom-select-wrap").forEach((wrap) => {
      const select = wrap.querySelector("select");
      const trigger = wrap.querySelector(".custom-select-trigger");
      if (select && trigger) {
        const opt = select.options[select.selectedIndex];
        const placeholder = select.querySelector("option[value='']");
        trigger.textContent = opt ? opt.textContent : (placeholder ? placeholder.textContent : "Select…");
      }
    });

    if (currentStep === 3) {
      populateReview();
    }
  } catch {
    // ignore malformed draft
  }
}

function saveDraft() {
  persist();
  showToast("Draft saved on this device.");
}

document.addEventListener("DOMContentLoaded", init);

