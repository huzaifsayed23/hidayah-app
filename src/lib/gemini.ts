export async function translateToHinglish(englishText: string): Promise<string> {
  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: englishText }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Translation failed: ${response.status}`);
    }

    return data.translation;
  } catch (error: any) {
    console.error("Hinglish Translation Failed:", error);
    throw error;
  }
}
