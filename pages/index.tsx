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

import styles from "@/styles/Home.module.scss";
import MicIcon from "@mui/icons-material/Mic";
import MicNoneIcon from "@mui/icons-material/MicNone";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import { Button, Container, Grid, MenuItem, Select, TextField } from "@mui/material";
import axios from 'axios';
import clsx from 'clsx';
import * as commonmark from 'commonmark';
import { useCallback, useEffect, useMemo, useState } from "react";

const maxRecordTime = 5;

async function recordAudio(signal: AbortSignal, onData: (data: Blob) => any) {
    const stream = await navigator.mediaDevices.getUserMedia({
        audio: true
    });

    const mediaRecorder = new MediaRecorder(stream);

    const chunks: Blob[] = [];
    mediaRecorder.ondataavailable = (e) => {
        console.log('audio chunk:', e.data.size);
        chunks.push(e.data);

        onData(
            new Blob(chunks, { type: "audio/ogg; codecs=opus" })
        );
    };

    mediaRecorder.start();

    const nextTick = () => {
        setTimeout(() => {
            if (signal.aborted) {
                mediaRecorder.stop();
            } else {
                nextTick();
            }
        }, 250);
    };
    nextTick();
}

export default function Home() {
    const [abortRecordController, setAbortRecordController] = useState<AbortController>();
    const [isAudioSupported, setIsAudioSupported] = useState<boolean>();
    const [isSendingPrompt, setIsSendingPrompt] = useState<boolean>(false);
    const [isTranscribingAudio, setIsTranscribingAudio] = useState<boolean>(false);
    const [language, setLanguage] = useState('en');
    const [lastAnswer, setLastAnswer] = useState('');
    const [prompt, setPrompt] = useState('');
    const [secondsLeft, setSecondsLeft] = useState<number>();

    const isRecordingAudio = useMemo(() => {
        return !!abortRecordController;
    }, [abortRecordController]);

    const isBusy = useMemo(() => {
        return isRecordingAudio ||
            isSendingPrompt ||
            isTranscribingAudio;
    }, [isRecordingAudio, isSendingPrompt, isTranscribingAudio]);

    const transcribeBlob = useCallback(async (audioData: Blob) => {
        setIsTranscribingAudio(true);

        try {
            const {
                data,
                status
            } = await axios.post('/api/transcribe', audioData, {
                params: {
                    language
                },
                responseType: 'text'
            });

            if (status !== 200) {
                throw new Error(`Unexpected response: ${status}`);
            }

            setPrompt(String(data).trim());
        } finally {
            setIsTranscribingAudio(false);
        }
    }, [language]);

    const sendPrompt = useCallback(async () => {
        if (prompt.trim() === '') {
            return;
        }

        setIsSendingPrompt(true);

        try {
            const {
                data,
                status
            } = await axios.post('/api/chat', {
                prompt: prompt.trim()
            });

            if (status !== 200) {
                throw new Error(`Unexpected response: ${status}`);
            }

            setLastAnswer(data.answer);
        } finally {
            setIsSendingPrompt(false);
        }
    }, [prompt]);

    const renderRecordButton = useCallback(() => {
        const buttonText = typeof secondsLeft === 'number' ?
            `Recording (${secondsLeft}) ...` :
            "Record audio";

        const icon = isRecordingAudio ?
            <MicIcon /> :
            <MicNoneIcon />;

        const onClick = abortRecordController ?
            (() => {
                abortRecordController.abort();
            }) : (() => {
                const newAbortController = new AbortController();

                recordAudio(
                    newAbortController.signal,
                    (audioData) => {
                        setAbortRecordController(undefined);

                        transcribeBlob(audioData).catch(console.error);
                    }
                );
                setAbortRecordController(newAbortController);
            });

        const color = isRecordingAudio ?
            'warning' :
            'primary';

        return (
            <Button
                color={color}
                startIcon={icon}
                disabled={isBusy}
                variant="contained" size="large"
                onClick={onClick}
                style={{
                    width: '100%',
                }}
            >{buttonText}</Button>
        );
    }, [abortRecordController, isBusy, isRecordingAudio, secondsLeft, transcribeBlob]);

    const renderSubmitPromptButton = useCallback(() => {
        return (
            <Button
                disabled={isBusy || prompt.trim() === ''}
                startIcon={<SmartToyIcon />}
                variant="outlined" size="large"
                onClick={() => {
                    sendPrompt().catch(console.error);
                }}
                style={{
                    width: '100%',
                }}
            >Send prompt</Button>
        );
    }, [isBusy, prompt, sendPrompt]);

    const renderLastAnswer = useCallback(() => {
        try {
            const reader = new commonmark.Parser();
            const parsed = reader.parse(lastAnswer);

            const writer = new commonmark.HtmlRenderer();
            const html = writer.render(parsed);

            return (
                <div
                    dangerouslySetInnerHTML={{
                        __html: html
                    }}
                />
            );

        } catch (error) {
            return (
                <div>Markdown render error: {String(error)}</div>
            );
        }
    }, [lastAnswer]);

    const renderContent = useCallback(() => {
        if (typeof isAudioSupported !== 'boolean') {
            return null;
        }

        return (
            <>
                <Grid
                    style={{
                        width: '600px'
                    }}
                >
                    <Grid
                        item xs={6}
                        style={{
                            marginBottom: '2rem'
                        }}
                    >
                        <TextField
                            variant="standard"
                            placeholder="Prompt"
                            disabled={isBusy}
                            multiline
                            minRows={1}
                            maxRows={15}
                            style={{
                                width: '600px'
                            }}
                            value={prompt}
                        />
                    </Grid>

                    <Grid
                        item xs={12}
                    >
                        <Select
                            style={{
                                width: '100%',
                                marginBottom: '2rem'
                            }}
                            value={language}
                            label="Language"
                            disabled={isBusy}
                            onChange={(e) => {
                                setLanguage(e.target.value);
                            }}
                        >
                            <MenuItem value={'en'}>🇺🇸 English</MenuItem>
                            <MenuItem value={'de'}>🇩🇪 German</MenuItem>
                        </Select>
                    </Grid>

                    <Grid item xs={6}>
                        <Grid container spacing={1}>
                            <Grid item xs={6}>
                                {renderRecordButton()}
                            </Grid>
                            <Grid item xs={6}>
                                {renderSubmitPromptButton()}
                            </Grid>
                        </Grid>
                    </Grid>

                    <Grid item xs={12}>
                        <Container>
                            {renderLastAnswer()}
                        </Container>
                    </Grid>
                </Grid>
            </>
        );
    }, [isAudioSupported, isBusy, language, prompt, renderLastAnswer, renderRecordButton, renderSubmitPromptButton]);

    useEffect(() => {
        if (!isAudioSupported) {
            return;
        }
        if (!abortRecordController) {
            return;
        }

        let counter = maxRecordTime;
        const updateSecondsLeftFromCounter = () => {
            setSecondsLeft(counter);
        };

        updateSecondsLeftFromCounter();
        const i = setInterval(() => {
            if (--counter <= 0) {
                resetTimer();

                abortRecordController.abort();
                setSecondsLeft(undefined);
            } else {
                updateSecondsLeftFromCounter();
            }
        }, 1000);

        const resetTimer = () => {
            clearInterval(i);
        };

        return () => {
            resetTimer();
        };
    }, [abortRecordController, isAudioSupported]);

    useEffect(() => {
        if (!!navigator?.mediaDevices?.getUserMedia) {
            setIsAudioSupported(true);
        } else {
            setIsAudioSupported(false);
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <main className={clsx(styles.main)}>
            {renderContent()}
        </main>
    );
}
