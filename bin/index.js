// server.js
import express from 'express';
import cors from 'cors';
import { EventRegistry, QueryArticlesIter } from "eventregistry";

const app = express();
app.use(cors());
const port = process.env.PORT || 3000;

// API endpoint
app.get('/api/articles', async (req, res) => {
    try {
        const er = new EventRegistry({ apiKey: process.env.EVENTREGISTRY_API_KEY });
        const conceptUri = await er.getConceptUri("Longevity");
        
        const articles = [];
        const q = new QueryArticlesIter(er, { 
            conceptUri: conceptUri, 
            sortBy: "date", 
            maxItems: 10,
            dataType: "news"  // Add additional filtering if needed
        });
        
        await q.execQuery((item) => {
            articles.push({
                title: item.title,
                url: item.url,
                date: item.date,
                source: item.source?.title,
                image: item.image,
                body: item.body
            });
        });

        res.json({
            success: true,
            data: articles
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Error fetching articles"
        });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});