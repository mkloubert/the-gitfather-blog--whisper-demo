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

import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { AppBar, Box, IconButton, ThemeProvider, Toolbar, Typography, createTheme } from "@mui/material";
import { Head, Html, Main, NextScript } from "next/document";
import { useCallback, useMemo, useState } from 'react';

const darkTheme = createTheme({
    palette: {
        mode: 'dark',
    },
});

const lightTheme = createTheme({
    palette: {
        mode: 'light',
    },
});

export default function Document() {
    const [colorMode, setColorMode] = useState<'dark' | 'light'>('dark');

    const currentTheme = useMemo(() => {
        return colorMode === 'dark' ? darkTheme : lightTheme;
    }, [colorMode]);

    const toggleColorMode = useCallback(() => {
        setColorMode(
            colorMode === 'dark' ? 'light' : 'dark'
        );
    }, [colorMode]);

    return (
        <Html lang="en">
            <Head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    rel="stylesheet"
                    href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap"
                />
                <link
                    rel="stylesheet"
                    href="https://fonts.googleapis.com/icon?family=Material+Icons"
                />
            </Head>
            <body>
                <ThemeProvider theme={currentTheme}>
                    <Box sx={{ flexGrow: 1 }}>
                        <AppBar position="fixed">
                            <Toolbar>
                                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                                    Whisper demo
                                </Typography>

                                <Box sx={{ flexGrow: 1 }} />
                                <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
                                    <IconButton
                                        size="large" aria-label="show 4 new mails" color="inherit"
                                        onClick={toggleColorMode}
                                    >
                                        {colorMode === 'dark' ? (
                                            <DarkModeIcon />
                                        ) : (
                                            <LightModeIcon />
                                        )}
                                    </IconButton>
                                </Box>
                            </Toolbar>
                        </AppBar>
                    </Box>

                    <Main />
                    <NextScript />
                </ThemeProvider>
            </body>
        </Html>
    );
}
