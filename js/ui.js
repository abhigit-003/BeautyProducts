import { $ } from "./utils.js";

/**
 * Renders Aadhar front or back preview with a remove button.
 */
export function renderAadharPreview(type, fileData, onRemove) {
    const container = $(`#aadhar-${type}-preview`);
    const labelText = $(`#aadhar-${type}-label`);
    if (!container || !labelText) return;

    container.innerHTML = "";

    if (!fileData) {
        container.classList.add("hidden");
        labelText.parentElement.querySelector("input").value = ""; // Clear file input
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        container.classList.remove("hidden");

        const img = document.createElement("img");
        img.src = e.target.result;

        const removeBtn = document.createElement("button");
        removeBtn.className = "remove-aadhar-btn";
        removeBtn.innerHTML = "×";
        removeBtn.onclick = (event) => {
            event.preventDefault();
            onRemove();
        };

        container.appendChild(img);
        container.appendChild(removeBtn);
    };
    reader.readAsDataURL(fileData);
}

/**
 * Populates Age dropdown options (18-65)
 */
export function populateAgeOptions() {
    const ageSelect = $("#ageSelect");
    if (!ageSelect) return;
    for (let i = 18; i <= 65; i++) {
        const opt = document.createElement("option");
        opt.value = i;
        opt.textContent = i;
        ageSelect.appendChild(opt);
    }
}

export function initCustomSelects(onSelect) {
    const selects = document.querySelectorAll(".custom-select");
    // ... existing logic if I had custom selects ...
    // Since index.html has standard selects right now, let's just bind them
    const standardSelects = document.querySelectorAll("select");
    standardSelects.forEach(select => {
        select.addEventListener("change", (e) => {
            if (onSelect) onSelect(select.id, e.target.value);
        });
    });
}
