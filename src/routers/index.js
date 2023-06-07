//import * as fs from 'fs';
import express from "express";
import path from "path";
import { exec } from 'child_process';
import axios from 'axios';
import fse from 'fs-extra/esm'
import filenamify from 'filenamify';
import * as dotenv from 'dotenv';
dotenv.config();
import { createRequire } from 'module';
const rootPath = path.resolve();
const index = express.Router();
const require = createRequire(import.meta.url);
const debug = require('debug')('app');
const shellescape = require('shell-escape');
const { auth } = require('express-oauth2-jwt-bearer');

const publicFolder = 'public';
const originalsFolder = 'original';
const port = process.env.PORT || 5100;
const cacheFolder = process.env.CACHE_DIR || 'images';
const serviceURL = process.env.SERVICE_URL || `http://localhost:${port}`;

const publicPath = path.join(rootPath, publicFolder);
const cachePath = path.join(publicPath, cacheFolder);
const originalsPath = path.join(publicPath, originalsFolder);

index.get('/', async (req, res) => {
    const opts = { mode: 0o775 };
    await fse.ensureDir(publicPath, opts);
    await fse.ensureDir(cachePath, opts);
    await fse.ensureDir(originalsPath, opts);
    res.send('App ready.');
});

if (process.env.ENABLE_AUTH === 'true') {
    if (process.env.AUTH_IDENTIFIER && process.env.AUTH_BASE_URL) {
        const checkJwt = auth({
            audience: process.env.AUTH_IDENTIFIER,
            issuerBaseURL: process.env.AUTH_BASE_URL
        });

        debug(`Auth enabled!`);
        index.use(checkJwt);
        index.use((err, req, res, next) => {
            let data = { error: err };
            res.status(err.status).json(data);
        });
    }
}

const execShellCommand = (cmd) => {
    return new Promise((resolve, reject) => {
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                reject(error);
            }
            resolve(stdout ? stdout : stderr);
        });
    });
}

const isValidUrl = (string) => {
    try {
        new URL(string);
        return true;
    } catch (err) {
        return false;
    }
}

const validImageFile = (contentType) => {
    const validTypes = ['image/png', 'image/jpg', 'image/jpeg'];
    return validTypes.includes(contentType.toLowerCase());
}

const validImageExt = (ext) => {
    const validExts = ['.png', '.jpg', '.jpeg', '.gif'];
    return validExts.includes(ext.toLowerCase());
}

const downloadImageFromURL = async (url) => {
    const data = {};
    const fileName = path.basename(url);
    const filePath = path.join(originalsPath, fileName);

    let cacheFileExists = await fse.pathExists(filePath);

    if (cacheFileExists) {
        // we already have one by that name
        data.success = 1;
        data.existed = 1;
        data.filename = fileName;
    } else {
        try {
            const response = await axios.get(url, { responseType: 'arraybuffer' });
            const type = response.headers.get('content-type');

            if (validImageFile(type)) {
                try {
                    await fse.outputFile(filePath, response.data);
                    data.success = 1;
                    data.filename = fileName;
                    //data.headers = response.headers;
                } catch (error) {
                    data.error = error;
                }
            } else {
                data.error = "Invalid file type."
            }
        } catch (error) {
            data.error = error.message;
            data.status = error.status;
            data.code = error.code;
        }
    }

    return data;
}

index.post('/', async (req, res, next) => {
    //await createCacheDir();
    const opts = { mode: 0o2775 };
    await fse.ensureDir(publicPath, opts);
    await fse.ensureDir(cachePath, opts);
    await fse.ensureDir(originalsPath, opts);

    let data = {
        // headers: req.headers,
        // params: req.query,
        // body: req.body,
        // auth: req.auth
    };

    // expecting: imageurl, entry, options, outputfile
    var imageurl, entry, options, outputfile, error;

    if (req.body.entry) {
        // validate. currently only accept 'convert'
        entry = req.body.entry;

        if (entry !== 'convert') {
            error = `Invalid entry: ${entry}`;
        }
    } else {
        error = 'Paramater `entry` must be set.';
    }

    if (req.body.options && Array.isArray(JSON.parse(req.body.options))) {
        options = JSON.parse(req.body.options);
        // data.body.options = options;
    } else {
        error = 'Paramater `options` must be set, and must be an array.';
    }

    if (req.body.outputfile) {
        outputfile = filenamify(req.body.outputfile, { replacement: '-' });

        // make sure it has a valid extension
        let testext = path.parse(outputfile).ext;
        if (!testext || !validImageExt(testext)) {
            error = `Invalid image extension: '${testext}'`;
        }
    } else {
        error = 'Paramater `outputfile` must be set.';
    }

    if (error) {
        data.error = error;
    } else {
        if (req.body.imageurl && isValidUrl(req.body.imageurl)) {
            imageurl = req.body.imageurl;

            try {
                let results = await downloadImageFromURL(imageurl);

                if (results.success && results.filename) {
                    let cacheFile = path.join(originalsPath, results.filename);
                    let transformFile = path.join(cachePath, outputfile);

                    let cacheFileExists = await fse.pathExists(cacheFile);
                    let transformFileExists = await fse.pathExists(transformFile);

                    if (cacheFileExists) {
                        const escaped = shellescape(options);
                        const cmd = `magick ${entry} ${escaped}`;

                        if (!transformFileExists) {
                            try {
                                await execShellCommand(`${cmd} "${cacheFile}" "${transformFile}"`);
                                let transformFileExists = await fse.pathExists(transformFile);
                                if (transformFileExists) {
                                    data.success = true;
                                    data.existed = false;
                                    data.message = `File not in cache, so it was created.`
                                    data.filename = outputfile;
                                    data.cmd = `${cmd} ${results.filename} ${outputfile}`;
                                    data.transformed = `${serviceURL}/${cacheFolder}/${outputfile}`;
                                } else {
                                    data.error = 'Image transform failed.';
                                }
                            } catch (e) {
                                data.error = `Could not run '${cmd}' on file: ${results.filename}`;
                                await fse.remove(transformFile); //delete it, as it wasn't transformed
                            }
                        } else {
                            // just return the file
                            data.success = true;
                            data.existed = true;
                            data.message = `A file with the name ${outputfile} already existed Serving from cache.`
                            data.filename = outputfile;
                            data.cmd = `${cmd} ${results.filename} ${outputfile}`;
                            data.transformed = `${serviceURL}/${cacheFolder}/${outputfile}`;
                        }
                    } else {
                        data.error = 'File download failed.';
                    }
                } else {
                    data.error = 'File download failed.';
                }
            } catch (err) {
                debug(err);
                data.error = err
            }
        } else {
            data.error = 'Invalid url';
        }
    }

    res.json(data);
});

export default index;