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
                    content: `Generate ${numComments} unique, engaging Twitter reply comments that work for ANY tweet. 
          
          CRITICAL RULES:
          - Never mention specific content types (thread, video, article, image, poll, etc.)
          - Keep comments universally applicable
          - Be genuine and conversational
          - 1-2 sentences maximum
          - Mix different tones: supportive, curious, thoughtful, enthusiastic
          - No hashtags, emojis, or promotional content
          - Avoid phrases like "love this thread", "great article", "nice video"
          
          GOOD EXAMPLES:
          - "This really resonates. Thanks for sharing your perspective on this."
          - "Interesting take! I hadn't thought about it from that angle before."
          - "Appreciate you putting this out there. Gives me something to think about."
          - "This is valuable. Saving this for later reference."
          - "Really well said. This needed to be discussed more openly."
          - "Thanks for sharing this insight. It's refreshing to see."
          - "You make a compelling point here. Would love to hear more of your thoughts."
          - "This is spot on. Needed to see this today."
          
          Return ONLY a JSON array of strings, no other text:
          ["comment1", "comment2", ...]`
                }],
                temperature: 0.9,
                max_tokens: 2000
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