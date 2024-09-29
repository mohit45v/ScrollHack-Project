import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';
import Alumni from './models/alumni.js';
import { Configuration, OpenAIApi } from 'openai'; // Correctly import named exports

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

app.post('/api/mentor-search', async (req, res) => {
    const { prompt } = req.body;

    try {
        const alumniData = await Alumni.find();

        const alumniProfiles = alumniData.map(alumni => `
            Name: ${alumni.name}
            Skills: ${alumni.skills.join(', ')}
            Workplace: ${alumni.workplace}
            Experience: ${alumni.experience} years
            Description: ${alumni.description}
        `).join('\n\n');

        const finalPrompt = `
            Based on the following student request, suggest the best alumni mentor from the list below:
            Request: ${prompt}

            Alumni Profiles:
            ${alumniProfiles}
        `;

        const response = await openai.createCompletion({
            model: 'text-davinci-003',
            prompt: finalPrompt,
            max_tokens: 200,
            temperature: 0.7,
        });

        const aiResponse = response.data.choices[0].text.trim();
        res.json({ message: aiResponse });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching alumni data or with AI search.' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
