import React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import GitHubIcon from '@mui/icons-material/GitHub';

export default function TopBar({ gr_id }) {
    const goto_github = () => { window.open("https://github.com/the-parallel-gods/mpi.js"); }

    const goto_docs = () => { window.open("https://the-parallel-gods.github.io/mpi.js/home"); }

    const get_status = () => {
        if (gr_id === -2) return "Disconnected from God Server";
        if (gr_id === -1) return "Connecting to God Server";
        if (gr_id === 0) return "God Node";
        return "Global Node " + gr_id;
    }

    return (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        MPI.js - {get_status()}
                    </Typography>
                    <IconButton color="inherit" onClick={goto_docs}>
                        <MenuBookIcon />
                    </IconButton>
                    <IconButton color="inherit" onClick={goto_github}>
                        <GitHubIcon />
                    </IconButton>

                </Toolbar>
            </AppBar>
        </Box>
    );
}
