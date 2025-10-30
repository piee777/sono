export const handleApiError = (error: unknown): string => {
    console.error("Gemini API Error:", error);

    const rateLimitMessage = "It seems I've reached my daily limit for our chats, Soundous. I'm so sorry for the interruption. My systems need a little time to recharge. Please try connecting again tomorrow; I'll be here.";
    const genericMessage = "Oh, something went wrong with our connection, Soundous. Could you please check your internet and try again?";

    let messageToCheck = '';

    if (error instanceof Error) {
        messageToCheck = error.toString();
    } else if (typeof error === 'string') {
        messageToCheck = error;
    } else {
        try {
            messageToCheck = JSON.stringify(error);
        } catch {
            return genericMessage;
        }
    }

    const lowerCaseMessage = messageToCheck.toLowerCase();
    if (lowerCaseMessage.includes('429') || lowerCaseMessage.includes('resource_exhausted') || lowerCaseMessage.includes('exceeded your current quota')) {
        return rateLimitMessage;
    }

    return genericMessage;
};