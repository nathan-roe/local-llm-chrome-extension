import {type FC, StrictMode, useEffect, useState} from 'react';
import {type Container, createRoot} from 'react-dom/client';
import {Box, CircularProgress, Divider, Paper, Typography} from "@mui/material";
import {marked} from "marked";
import DOMPurify from 'dompurify';

declare var chrome: any;
const container = document.getElementById('popup');
const popup = createRoot(container as Container);

const Popup: FC = () => {
    return (
       <>Hello World</>
    );
}

popup.render(
    <StrictMode>
        <Popup/>
    </StrictMode>
);