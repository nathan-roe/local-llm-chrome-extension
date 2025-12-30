import {type FC, StrictMode, useCallback, useEffect, useMemo, useState} from 'react';
import {type Container, createRoot} from 'react-dom/client';
import {Box, CircularProgress, Divider, Paper, Typography} from "@mui/material";
import {marked, type RendererObject} from "marked";
import DOMPurify from 'dompurify';
import mermaid from "mermaid";
import '../styles.css';

const container = document.getElementById('response');
const response = createRoot(container as Container);
const renderer: Partial<RendererObject> = {
    code({ text, lang }: { text: string; lang?: string }) {
        switch(lang) {
            case 'mermaid':
                return `<pre class="mermaid">${text}</pre>`;
            default:
                return `<pre><code class="language-${lang}">${text}</code></pre>`;
        }
    }
};

// Apply the custom renderer
marked.use({ renderer });
mermaid.initialize({ startOnLoad: false, theme: 'default' });

const Popup: FC = () => {
    const [loading, setLoading] = useState(false);
    const [modelResponse, setModelResponse] = useState("Thinking...");
    const [prompt, setPrompt] = useState("");
    const [promptError, setPromptError] = useState(false);
    const [chartLoaded, setChartLoaded] = useState(false);

    const updatePromptState = useCallback(() => {
        chrome.storage.local.get(['prompt', 'prompt-error'], (res: Record<string, any>) => {
            setPrompt(res['prompt'] ?? '');
            setPromptError(!!res['prompt-error']);
            if(res['prompt-error']) {
                setLoading(false);
            }
        });
    }, [])

    const formatModelResponse = useCallback((response: string) => {
        console.log("changes['llm-response'].newValue: ", response, marked.parse(response));

        // Check if there is an unfinished mermaid block
        const isMermaidInProgress = response.includes('```mermaid') && !response.match(/```mermaid[\s\S]*```/);

        let processedResponse = response;
        if (isMermaidInProgress) {
            // Replace the unfinished block with a placeholder for the loading indicator
            processedResponse = response.replace(/```mermaid[\s\S]*$/, '<div class="mermaid-loading"></div>');
        }

        return DOMPurify.sanitize(marked.parse(processedResponse) as string);
    }, []);

    chrome.storage.onChanged.addListener((changes: Record<string, {newValue: string}>) => {
        if('llm-response' in changes) {
            setLoading(false);
            const rawValue = changes['llm-response'].newValue ?? '';
            const formattedResponse = formatModelResponse(rawValue);
            console.log("formattedResponse: ", formattedResponse)
            setModelResponse(formattedResponse);
        }
        updatePromptState();
    });

    useEffect(() => {
        updatePromptState();
        setLoading(true);
    }, [updatePromptState]);

    useEffect(() => {
        // Only trigger mermaid if the block is complete (has closing backticks)
        const isMermaidComplete = modelResponse.includes('class="mermaid"');
        console.log("Model response changed: ", modelResponse);
        if (isMermaidComplete) {
            console.log("Running mermaid: ", chartLoaded)
            mermaid.run({ querySelector: '.mermaid'}).then(() => {
                setChartLoaded(true);
            }).catch(console.error);
        }
    }, [modelResponse]);

    return (
        <Box sx={{ p: 2, minWidth: 400, backgroundColor: '#f5f7f9', minHeight: '100vh', boxSizing: 'border-box'}}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#1a2027' }}>
                Local LLM Assistant
            </Typography>

            <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: 2, border: '1px solid #e0e4e8' }}>
                <Typography variant="caption" sx={{ textTransform: 'uppercase', fontWeight: 'bold', color: '#707782' }}>
                    Your Prompt
                </Typography>
                <Typography variant="subtitle2" sx={{ mt: 1, color: '#3e4756' }}>
                    {prompt || "No prompt selected..."}
                </Typography>
            </Paper>

            <Paper elevation={2} sx={{ p: 2, borderRadius: 2, backgroundColor: '#ffffff' }}>
                <Box display="flex" alignItems="center" mb={1}>
                    <Typography variant="caption" sx={{ textTransform: 'uppercase', fontWeight: 'bold', color: '#1B4636', flexGrow: 1 }}>
                        AI Response
                    </Typography>
                    {loading && <CircularProgress size={16} thickness={5} />}
                </Box>
                <Divider sx={{ mb: 2 }} />
                {promptError ? 'Failed to generate response. Please try again.' : (
                    <div dangerouslySetInnerHTML={{ __html: modelResponse }} />
                )}
            </Paper>
        </Box>
    );
}

response.render(
    <StrictMode>
        <Popup/>
    </StrictMode>
);