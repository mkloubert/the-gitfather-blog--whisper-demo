// MIT License
//
// Copyright (c) 2024 Marcel Joachim Kloubert (https://marcel.coffee)
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

/// <reference path="../../index.d.ts" />

import axios from 'axios';
import dayjs from 'dayjs';
import {
    File,
    FormData
} from "formdata-node";
import type { NextApiRequest, NextApiResponse, NextConfig } from "next";
import fs from 'node:fs';
import path from 'node:path';

const {
    writeFile
} = fs.promises;

export const config: NextConfig = {
    api: {
        bodyParser: false,
    },
};

const OPENAI_API_KEY = process.env.OPENAI_API_KEY!.trim();

function readStream(stream: NodeJS.ReadableStream): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
        stream.once('error', reject);

        const chunks: Buffer[] = [];
        stream.on('data', (chunk) => {
            try {
                chunks.push(
                    Buffer.isBuffer(chunk) ?
                        chunk :
                        Buffer.from(String(chunk))
                );
            } catch (error) {
                reject(error);
            }
        });

        stream.once('end', () => {
            resolve(
                Buffer.concat(chunks)
            );
        });
    });
}

export default async function transcribeAudio(
    request: NextApiRequest,
    response: NextApiResponse,
) {
    const language = String(request.query['language']).toLowerCase().trim() || undefined;

    const timestamp = dayjs().format('YYYYMMDD_HHmmss');

    const oggData = await readStream(request);

    const outFile = path.join(request.appRoot, `audio/transscription_${timestamp}.ogg`);
    await writeFile(outFile, oggData);

    const form = new FormData();
    form.set("model", "whisper-1");
    form.set("file", new File([oggData], 'audio.ogg'));

    if (language) {
        form.set("language", language);
    }

    const transcribeAudioResponse = await axios.post(
        'https://api.openai.com/v1/audio/transcriptions',
        form,
        {
            headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            validateStatus: () => true,
        }
    );

    if (transcribeAudioResponse.status !== 200) {
        throw new Error(`Unexpected response: ${transcribeAudioResponse.status}`);
    }

    const text = transcribeAudioResponse.data.text as string;
    const textBuffer = Buffer.from(text, 'utf8');

    response.writeHead(200, {
        'Content-Type': 'text/plain; charset=UTF-8',
        'Content-Length': String(textBuffer.length)
    });
    response.end(textBuffer);
}
