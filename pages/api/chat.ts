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
import type { NextApiRequest, NextApiResponse } from "next";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY!.trim();

export default async function chat(
    request: NextApiRequest,
    response: NextApiResponse,
) {
    const prompt = request.body!.prompt as string;

    const chatResponse = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
            "model": "gpt-3.5-turbo",
            "messages": [
                {
                    "role": "system",
                    "content": "You are a helpful assistant. Respond in markdown."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 1
        },
        {
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            validateStatus: () => true,
        }
    );

    if (chatResponse.status !== 200) {
        throw new Error(`Unexpected response: ${chatResponse.status}`);
    }

    const answer = JSON.stringify({
        answer: chatResponse.data.choices[0].message.content as string
    });
    const answerBuffer = Buffer.from(answer, 'utf8');

    response.writeHead(200, {
        'Content-Type': 'application/json; charset=UTF-8',
        'Content-Length': String(answerBuffer.length)
    });
    response.end(answerBuffer);
}
