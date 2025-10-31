import type { ChatMessage } from '../types';

const callApi = async (body: object): Promise<any> => {
    const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        throw new Error(errorData.error || `API request failed with status ${response.status}`);
    }

    return response.json();
}

export const getChatResponse = async (history: ChatMessage[], message: string): Promise<string> => {
    try {
        const data = await callApi({
            type: 'chat',
            history: history,
            message: message,
        });
        return data.text;
    } catch (error) {
        console.error("API Error in getChatResponse:", error);
        throw error;
    }
}

export const generateOneTimeResponse = async (prompt: string): Promise<string> => {
    try {
        const data = await callApi({
            type: 'generate',
            prompt: prompt,
        });
        return data.text;
    } catch (error) {
        console.error("API Error in generateOneTimeResponse:", error);
        throw error;
    }
};