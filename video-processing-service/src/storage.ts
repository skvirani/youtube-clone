// 1. GCS file interactions
// 2. Local file interactions
import { Storage } from '@google-cloud/storage';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import { resolve } from 'path';

const storage = new Storage();

const rawVideoBucketName = 'skvirani-yt-raw-videos';
const processedVideoBucketName = 'skvirani-yt-processed-videos';

const localRawVideoPath = './raw-videos';
const localProcessedVideoPath = './processed-videos';

// Creates the local directories for raw and unprocessed videos
export function setupDirectories() {
    ensureDirectoryExistence(localRawVideoPath);
    ensureDirectoryExistence(localProcessedVideoPath);
}

/*
*   @param rawVideoName - The name of the file to convert from (@link localRawVideoPath).
*   @param processedVideoName - The name of the file to convert to (@link localProcessedVideoPath).
*   @return A promise that resolves when the video has been converted to 360p.
*/
export function convertVideoTo360P(rawVideoName: string, processedVideoName: string) {
    return new Promise<void>((resolve, reject) => {
        ffmpeg(`${localRawVideoPath}/${rawVideoName}`)
    .outputOptions('-vf', 'scale=-1:360') //convert video to 360p
    .on('progress', function(e) {
        console.log(e);
    })
    .on('end', function() {
        console.log('Video processing finished successfully.');
        resolve();
    })
    .on('error', function(err: any) {
        console.log(`An error occurred: ${err.message}`);
        reject(err);
    })
    .save(`${localProcessedVideoPath}/${processedVideoName}`);
    }); 
}

export async function downloadRawVideo(fileName: string) {
    await storage.bucket(rawVideoBucketName)
        .file(fileName)
        .download({destination: `${localRawVideoPath}/${fileName}`});

    console.log(
        `gs://${rawVideoBucketName}/${fileName} downloaded to ${localRawVideoPath}/${fileName}.`
    );
}

export async function uploadProcessVideo(fileName: string) {
    const bucket = storage.bucket(processedVideoBucketName);
    // upload video to bucket
    await bucket.upload(`${localProcessedVideoPath}/${fileName}`, {destination: fileName});
    //make file public
    await bucket.file(fileName).makePublic();

}

export function deleteRawVideo(fileName: string) {
    return deleteFile(`${localRawVideoPath}/${fileName}`)
}

export function deleteProcessedVideo(fileName: string) {
    return deleteFile(`${localProcessedVideoPath}/${fileName}`)
}

function deleteFile(filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        if (fs.existsSync(filePath)) {
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.log(`Failed to delete file at ${filePath}`, err);
                } else {
                    console.log(`File deleted at ${filePath}`);
                    resolve();
                }
            })
        } else {
            console.log(`File not found at ${filePath}, skipping the delete.`)
            reject(`File ${filePath} does not exist`);
        }
    })
}

function ensureDirectoryExistence(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, {recursive: true});
        console.log(`Directory created at ${dirPath}`);
    }
}