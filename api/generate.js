export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { numComments } = req.body;

        console.log('Generating comments for:', numComments, 'links');

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [{
                    role: 'user',
                    content: `Generate ${numComments} completely unique and diverse Twitter reply comments. Each comment must be DIFFERENT from the others.

CRITICAL REQUIREMENTS:
- Every comment must use completely different words, phrases, and sentence structures
- Never repeat the same opening words (avoid starting multiple comments with "This", "Great", "Thanks", "Interesting", etc.)
- Never mention specific content types: NO thread, video, article, post, image, take, perspective, insight, point
- Use natural, casual language that real people use
- 1-2 sentences maximum
- Mix tones: thoughtful, curious, supportive, enthusiastic, reflective, appreciative
- No hashtags, no emojis, no promotional language
- Be creative and authentic

VARIETY TECHNIQUES:
- Use different sentence starters
- Vary between statements, questions, and reactions
- Mix short punchy comments with slightly longer ones
- Include different emotional tones
- Use varied vocabulary

FORBIDDEN PHRASES (do not use):
- "love this thread/post/article"
- "great point/take/insight" 
- "thanks for sharing"
- "this resonates"
- "well said"
- "spot on"

Focus on creating genuine human reactions that could apply to any tweet without being specific about what type of content it is.

Return ONLY a JSON array of ${numComments} unique comment strings with NO other text:
["comment1", "comment2", ...]`
                }],
                temperature: 1.2,
                max_tokens: 3000,
                top_p: 0.95,
                frequency_penalty: 1.5,
                presence_penalty: 1.5
            })
        });

        const data = await response.json();
        console.log('Groq API response:', JSON.stringify(data, null, 2));

        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            console.error('Invalid API response:', data);
            return res.status(500).json({ error: 'Invalid API response', details: data });
        }

        const text = data.choices[0].message.content;
        console.log('Generated text:', text);

        res.status(200).json({ text });
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: error.message });
    }
}