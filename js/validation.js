import { MAX_FILE_SIZE_BYTES } from "./config.js";

export const validationSchema = {
    1: {
        fields: ["business_type", "experienceSelect", "fullname", "ageSelect", "genderSelect"],
        validate: (data) => {
            const errors = {};
            if (!data.business_type) errors.business_type = "Please select a business type.";
            if (!data.experienceSelect) errors.experienceSelect = "Please select your experience.";
            if (!data.fullname?.trim()) errors.fullname = "Full name is required.";
            if (!data.ageSelect) errors.ageSelect = "Please select your age.";
            if (!data.genderSelect) errors.genderSelect = "Please select your gender.";
            return errors;
        }
    },
    2: {
        fields: ["mobile1"],
        validate: (data) => {
            const errors = {};
            const phoneRegex = /^[6-9]\d{9}$/;
            if (!data.mobile1) {
                errors.mobile1 = "Primary mobile number is required.";
            } else if (!phoneRegex.test(data.mobile1)) {
                errors.mobile1 = "Please enter a valid 10-digit mobile number.";
            }
            if (data.mobile2 && !phoneRegex.test(data.mobile2)) {
                errors.mobile2 = "Please enter a valid alternate mobile number.";
            }
            return errors;
        }
    },
    3: {
        fields: ["acceptTerms"],
        validate: (data) => {
            const errors = {};
            if (!data.acceptTerms) errors.acceptTerms = "You must agree to the terms and conditions.";
            return errors;
        }
    },
    4: {
        fields: ["aadhar-number", "aadhar-front", "aadhar-back"],
        validate: (data) => {
            const errors = {};
            const aadharRegex = /^\d{12}$/;
            const nakedVal = data["aadhar-number"]?.replace(/\s/g, "");
            if (!nakedVal) {
                errors["aadhar-number"] = "Aadhar number is required.";
            } else if (!aadharRegex.test(nakedVal)) {
                errors["aadhar-number"] = "Aadhar number must be 12 digits.";
            }
            if (!data.aadhar_front) errors["aadhar-front"] = "Please upload Aadhar card front image.";
            if (!data.aadhar_back) errors["aadhar-back"] = "Please upload Aadhar card back image.";
            return errors;
        }
    }
};

export function validateFile(file) {
    if (file.size > MAX_FILE_SIZE_BYTES) {
        return { valid: false, error: "File exceeds 5MB limit." };
    }
    return { valid: true };
}
