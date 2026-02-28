export const serviceApi = {
    /**
     * Mock submission function.
     * In a real app, this would use fetch() to send formData to a backend.
     * @param {Object} data 
     * @returns {Promise}
     */
    async submitRegistration(data) {
        console.log("Submitting registration data to API:", data);

        // Simulate network delay
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Simulate 95% success rate
                if (Math.random() > 0.05) {
                    resolve({ success: true, message: "Registration successful!" });
                } else {
                    reject({ success: false, message: "Server error. Please try again later." });
                }
            }, 1500);
        });
    }
};
