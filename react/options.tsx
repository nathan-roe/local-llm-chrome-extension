import {type FC, StrictMode, useEffect, useState} from 'react';
import {type Container, createRoot} from 'react-dom/client';
import {
    Button,
    Container as MuiContainer,
    Typography,
    Paper,
    Box,
    TextField,
    Divider,
    IconButton,
    Tooltip, createTheme, ThemeProvider
} from '@mui/material';
import {Edit as EditIcon, Visibility as ViewIcon, Save as SaveIcon} from '@mui/icons-material';
import DOMPurify from "dompurify";
import {marked} from "marked";

declare var chrome: any;

const container = document.getElementById('options');
const options = createRoot(container as Container);
const theme = createTheme({
    palette: {
        primary: {
            main: '#1B4636',
            contrastText: '#000',
        },
    },
});

const Options: FC = () => {
    const [userText, setUserText] = useState('');
    const [modelName, setModelName] = useState('llama3');
    const [port, setPort] = useState('11434');
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        chrome.storage.local.get(['prompt-context', 'model-name', 'port'], (result: Record<string, any>) => {
            if (result['prompt-context']) setUserText(result['prompt-context']);
            if (result['model-name']) setModelName(result['model-name']);
            if (result['port']) setPort(result['port']);
        });
    }, []);
    return (
        <Box sx={{
            margin: 0,
            padding: 0,
            minHeight: '100vh',
            width: '100%',
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
                    <Box mb={3}>
                        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold" color="primary">
                            LLM Configuration
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Customize your local LLM connection and additional context.
                        </Typography>
                    </Box>

                    <Divider sx={{mb: 3}}/>

                    <Box sx={{mb: 3}}>
                        <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                            <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                                Connection Settings
                            </Typography>
                            <Tooltip title={isEditing ? "Switch to Preview" : "Edit Context"}>
                                <IconButton onClick={() => setIsEditing(!isEditing)} color="primary">
                                    {isEditing ? <ViewIcon/> : <EditIcon/>}
                                </IconButton>
                            </Tooltip>
                        </Box>
                        <Box display="flex" gap={2} mt={1}>
                            <TextField
                                label="Model Name"
                                variant="outlined"
                                size="small"
                                fullWidth
                                value={modelName}
                                onChange={(e) => setModelName(e.target.value)}
                                placeholder="e.g. llama3"
                                disabled={!isEditing}
                            />
                            <TextField
                                label="Port"
                                variant="outlined"
                                size="small"
                                sx={{ width: '150px' }}
                                value={port}
                                onChange={(e) => setPort(e.target.value)}
                                placeholder="11434"
                                disabled={!isEditing}
                            />
                        </Box>
                    </Box>

                    <Typography variant="subtitle1" fontWeight="medium" sx={{mb: 1}}>
                        Additional Context
                    </Typography>
                    {isEditing ? (
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
                    ) : (
                        <Box
                            sx={{
                                p: 2,
                                mb: 3,
                                minHeight: '150px',
                                bgcolor: 'grey.50',
                                borderRadius: 1,
                                border: '1px solid',
                                borderColor: 'divider',
                                whiteSpace: 'pre-wrap'
                            }}
                        >
                            {userText ? <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(userText, { async: false}) as string) }} /> : <Typography color="text.disabled" fontStyle="italic">No context provided.</Typography>}
                        </Box>
                    )}

                    <Box display="flex" justifyContent="flex-end" gap={2}>
                        {isEditing && (
                            <Button
                                variant="contained"
                                startIcon={<SaveIcon sx={{color: 'white'}}/>}
                                onClick={() => {
                                    setIsEditing(false);
                                    chrome.storage.local.set({
                                        'prompt-context': userText,
                                        'model-name': modelName,
                                        'port': port
                                    });
                                }}
                                size="large"
                                sx={{borderRadius: 2, px: 4, color: 'white'}}
                            >
                                Save Changes
                            </Button>
                        )}
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

options.render(
    <StrictMode>
        <ThemeProvider theme={theme}>
            <Options/>
        </ThemeProvider>
    </StrictMode>
);