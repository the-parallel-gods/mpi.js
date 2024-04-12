import React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import GitHubIcon from '@mui/icons-material/GitHub';

export default function TopBar() {
    const goto_github = () => { window.open("https://github.com/the-parallel-gods/mpi.js"); }

    const goto_docs = () => { window.open("https://the-parallel-gods.github.io/mpi.js/home"); }

    return (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        MPI.js
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
