export function $(selector) {
    return document.querySelector(selector);
}

export function $all(selector) {
    return Array.from(document.querySelectorAll(selector));
}

export function showToast(message) {
    const toast = $("#toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("visible");
    setTimeout(() => {
        toast.classList.remove("visible");
    }, 2600);
}

export function formatLabel(value) {
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
