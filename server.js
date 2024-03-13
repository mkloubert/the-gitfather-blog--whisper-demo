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

const {
    parse
} = require('node:url');
const {
    createServer
} = require('@egomobile/http-server');
const next = require('next');

const dev = process.env.NODE_ENV?.toLowerCase().trim() === "development";
const hostname = '0.0.0.0';
const port = 3000;

async function main() {
    const app = next({ dev, hostname, port });
    await app.prepare();

    const handle = app.getRequestHandler();

    const server = createServer();

    const middlewares = [];

    // any method ...
    server.all(
        () => true, // ... and any path
        middlewares,
        async (request, response) => {
            request.appRoot = __dirname;

            await handle(request, response, parse(request.url, true));
        },
    );

    await server.listen(port);
    console.info(`ℹ️ Next.js instance now running on port ${port} ...`);
}

main().catch((ex) => {
    console.error('🔥 [UNHANDLED EXCEPTION]', ex);

    process.exit(1);
});
