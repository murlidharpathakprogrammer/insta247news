import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { EventRegistry, QueryArticlesIter } from "eventregistry";

const app = express();
app.use(cors());
app.use(express.json());

const er = new EventRegistry({ apiKey: process.env.EVENTREGISTRY_API_KEY });

app.get('/api/articles', async (req, res) => {
    try {
        const { concept, maxItems = 10 } = req.query;
        
        if (!concept) {
            return res.status(400).json({
                success: false,
                message: "Concept parameter is required"
            });
        }

        const conceptUri = await er.getConceptUri(concept);
        if (!conceptUri) {
            return res.status(404).json({
                success: false,
                message: `Concept '${concept}' not found`
            });
        }

        const articles = [];
        const q = new QueryArticlesIter(er, {
            conceptUri: conceptUri,
            sortBy: "date",
            maxItems: Math.min(Number(maxItems) || 10, 50), // Limit to 50 max items
            // dataType: "news"
        });

        await new Promise((resolve, reject) => {
            q.execQuery(
                item => articles.push({
                    title: item.title,
                    url: item.url,
                    date: new Date(item.date).toISOString().split('T')[0],
                    source: item.source?.title || 'Unknown',
                    image: item.image,
                    description: item.body?.substring(0, 200) + '...'
                }),
                err => err ? reject(err) : resolve()
            );
        });

        res.json({
            success: true,
            data: articles
        });

    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));