import {type FC, StrictMode, useEffect, useState} from 'react';
import {type Container, createRoot} from 'react-dom/client';
import {
    Button,
    Container as MuiContainer,
    Typography,
    Paper,
    Box,
    TextField,
    createTheme,
    ThemeProvider
} from '@mui/material';
import {Save as SaveIcon} from '@mui/icons-material';
import '../styles.css';


const container = document.getElementById('popup');
const popup = createRoot(container as Container);
const theme = createTheme({
    palette: {
        primary: {
            main: '#1B4636',
            contrastText: '#000',
        },
    },
});

const Popup: FC = () => {
    const [userText, setUserText] = useState('');

    useEffect(() => {
        chrome.storage.local.get(['prompt-context'], (result: Record<string, any>) => {
            if (result['prompt-context']) setUserText(result['prompt-context']);
        });
    }, []);
    return (
        <Box sx={{
            margin: 0,
            padding: 0,
            minHeight: '200px',
            width: '300px',
            backgroundColor: '#3cb37163',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%3E%3Cpath fill='%231B4636' fill-opacity='0.2' d='M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,250.7C960,235,1056,181,1152,165.3C1248,149,1344,171,1392,181.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'%3E%3C/path%3E%3C/svg%3E")`,
            backgroundAttachment: 'fixed',
            backgroundSize: 'cover',
            backgroundPosition: 'center bottom',
            backgroundRepeat: 'no-repeat',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <MuiContainer maxWidth="sm" sx={{mt: 8, pb: 8}}>
                <Paper
                    elevation={6}
                    sx={{
                        p: 4,
                        borderRadius: 4,
                        bgcolor: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(218, 165, 32, 0.2)'
                    }}
                >
                    <Typography variant="subtitle1" fontWeight="medium" sx={{mb: 1}}>
                        Additional Context
                    </Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={6}
                        variant="outlined"
                        placeholder="e.g. Always respond in a concise manner and prioritize performance-oriented solutions..."
                        value={userText}
                        onChange={(event) => setUserText(event.target.value)}
                        sx={{mb: 3}}
                    />

                    <Box display="flex" justifyContent="flex-end" gap={2}>
                        <Button
                            variant="contained"
                            startIcon={<SaveIcon sx={{color: 'white'}}/>}
                            onClick={() => {
                                chrome.storage.local.set({
                                    'prompt-context': userText,
                                });
                            }}
                            size="large"
                            sx={{borderRadius: 2, px: 4, color: 'white'}}
                        >
                            Save Changes
                        </Button>
                    </Box>
                    <Box gap={2} textAlign="center">
                        <Typography variant="caption" color="text.disabled">
                            Settings are stored locally in your browser.
                        </Typography>
                    </Box>
                </Paper>
            </MuiContainer>
        </Box>
    );
};

popup.render(
    <StrictMode>
        <ThemeProvider theme={theme}>
            <Popup/>
        </ThemeProvider>
    </StrictMode>
);