import express from "express";
import ffmpeg from "fluent-ffmpeg";

const app = express();
app.use(express.json());

app.post('/process-video', (req, res) => {
    // Get path of the input video file from the request body
    console.log(`req: ${req}`);
    
    const inputFilePath = req.body.inputFilePath;
    const outputFilePath = req.body.outputFilePath;

    if (!inputFilePath || !outputFilePath) {
        res.status(400).send('Bad Request: Missing file path.');
    }

    console.log('Starting to process');
    ffmpeg(inputFilePath)
    .outputOptions('-vf', 'scale=-1:360') //convert video to 360p
    .on('progress', function(e) {
        console.log(e);
    })
    .on('end', function() {
        return res.status(200).send('Video processing finished successfully.');
    })
    .on('error', function(err: any) {
        console.log(`An error occurred: ${err.message}`);
        res.status(500).send(`Internal Server Error: ${err.message}`);
    })
    .save(outputFilePath);
});

const port = process.env.PORT || 3000;
app.listen(port,() => {
    console.log(`Video Processing Service listening at http://localhost:${port}`);
});