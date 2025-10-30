export const getClientIpAddress = async (): Promise<string | null> => {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        if (!response.ok) {
            console.warn('Response not OK when fetching IP address');
            return null;
        }
        const data = await response.json();
        return data.ip || null;
    } catch (error) {
        console.error("Could not get client IP address:", error);
        return null; // Return null on failure, don't block the main action
    }
};
