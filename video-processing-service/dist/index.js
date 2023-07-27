"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.post('/process-video', (req, res) => {
    // Get path of the input video file from the request body
    console.log(`req: ${req}`);
    const inputFilePath = req.body.inputFilePath;
    const outputFilePath = req.body.outputFilePath;
    if (!inputFilePath || !outputFilePath) {
        res.status(400).send('Bad Request: Missing file path.');
    }
    console.log('Starting to process');
    (0, fluent_ffmpeg_1.default)(inputFilePath)
        .outputOptions('-vf', 'scale=-1:360') //convert video to 360p
        .on('progress', function (e) {
        console.log(e);
    })
        .on('end', function () {
        return res.status(200).send('Video processing finished successfully.');
    })
        .on('error', function (err) {
        console.log(`An error occurred: ${err.message}`);
        res.status(500).send(`Internal Server Error: ${err.message}`);
    })
        .save(outputFilePath);
});
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Video Processing Service listening at http://localhost:${port}`);
});
