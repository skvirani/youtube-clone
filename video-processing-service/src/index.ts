import express from "express";
import { convertVideoTo360P, deleteProcessedVideo, deleteRawVideo, downloadRawVideo, setupDirectories, uploadProcessVideo } from "./storage";

setupDirectories();

const app = express();
app.use(express.json());

app.post('/process-video', async (req, res) => {
    //Get the bucket and filename from the Cloud Pub/Sub message
    let data;
    try {
        const message = Buffer. from(req.body.message.data, 'base64').toString('utf8');
        data = JSON.parse(message);
        if (!data.name) {
            throw new Error('Invalid message payload received.');
        }
    } catch (error) {
        console.error(error);
        return res.status(400).send('Bad request: missing filename.');
    }

    const inputFileName = data.name;
    const outputFileName = `processed-${inputFileName}`;

    //Download the raw video from cloud storage
    await downloadRawVideo(inputFileName)

    //Convert the video to 360p
    try {
        await convertVideoTo360P(inputFileName, outputFileName);
    } catch (error) {
        await Promise.all([
            deleteRawVideo(inputFileName), 
            deleteProcessedVideo(outputFileName)
        ]);
        console.error(error);
        return res.status(500).send('Internal Server Error: video processeing failed.')
    }

    //Upload the processed video to cloud storage
    await uploadProcessVideo(outputFileName);

    await Promise.all([
        deleteRawVideo(inputFileName), 
        deleteProcessedVideo(outputFileName)
    ]);

    return res.status(200).send('Processing finished successfully');
});

const port = process.env.PORT || 3000;
app.listen(port,() => {
    console.log(`Video Processing Service listening at http://localhost:${port}`);
});