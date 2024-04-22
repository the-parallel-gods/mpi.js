import React, { useEffect } from 'react';
import './App.css';
import { Job } from './mpi_core/job';
import Smartdashboard from './pages/Smartdashboard';
import TopBar from './components/TopBar';
import { GlobalRouter } from './mpi_core/global_router';
import TextField from '@mui/material/TextField';
import { Box, Button, FormControlLabel, InputLabel, MenuItem, Switch } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';

const GlobalContext = React.createContext(null);
const callback_box = { callback: () => { } };
let global_router;
export default function App() {
    const [context, setContext] = React.useState({
        gr_id: -1,
        program_path: "tests/test_bcast.js",
        num_proc: 4,
        interconnect: "crossbar",
        enable_smartdashboard: true,
        enable_diagnostics: true,
        optimized: true
    });


    useEffect(() => {
        const set_gr_id = (gr_id) => {
            console.log("set_gr_id", gr_id);
            setContext({ ...context, gr_id })
        };
        const ws_url = window.location.host.split(":")[0];
        global_router = new GlobalRouter();
        global_router.init(ws_url, set_gr_id).then(() => {
            new Job(
                callback_box,
                context.num_proc,
                global_router,
                context.interconnect,
                context.enable_smartdashboard,
                context.enable_diagnostics,
                context.optimized
            );
        });
    }, []);

    const on_start = () => {
        global_router.start(context.num_proc, context.program_path);
        console.log("Start requested");
    }
    return (
        <div>
            <GlobalContext.Provider value={{ context, setContext }}>
                <TopBar gr_id={context.gr_id} />
                <Box sx={{ mt: 5, ml: 10, mr: 20 }}>
                    {(context.gr_id === 0) ?
                        <TextField sx={{ m: 3 }} id="program_path" label="MPI Program Path" variant="outlined" fullWidth
                            value={context.program_path} onChange={(e) => setContext({ ...context, program_path: e.target.value })}
                        />
                        : ""}
                    <TextField sx={{ m: 3 }} id="num_proc" type="number" label="Num proc" variant="outlined" placeholder="4" fullWidth
                        value={context.num_proc} onChange={(e) => setContext({ ...context, num_proc: e.target.value })}
                    />
                    <FormControl sx={{ m: 3 }} fullWidth>
                        <InputLabel id="interconnect_select_label">Local interconnect architecture</InputLabel>
                        <Select
                            labelId="interconnect_select_label"
                            id="interconnect_select"
                            value={context.interconnect}
                            label="Local interconnect architecture"
                            onChange={(e) => setContext({ ...context, interconnect: e.target.value })}
                        >
                            <MenuItem value={"crossbar"}>Crossbar interconnect</MenuItem>
                            <MenuItem value={"ring"}>Ring interconnect</MenuItem>
                            <MenuItem value={"tree"}>Tree interconnect</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControlLabel sx={{ m: 3 }} control={<Switch defaultChecked />} label="Enable Smartdashboard"
                        value={context.enable_smartdashboard} onChange={(e) => setContext({ ...context, enable_smartdashboard: e.target.checked })} />
                    <FormControlLabel sx={{ m: 3 }} control={<Switch defaultChecked />} label="Enable Diagnostics"
                        value={context.enable_diagnostics} onChange={(e) => setContext({ ...context, enable_diagnostics: e.target.checked })}
                    />
                    <FormControlLabel sx={{ m: 3 }} control={<Switch defaultChecked />} label="Auto optimize"
                        value={context.optimized} onChange={(e) => setContext({ ...context, optimized: e.target.checked })}
                    />
                    <Box sx={{ m: 3 }}>
                        <Button variant="outlined" size="large" endIcon={<PlayArrowIcon />} onClick={on_start}>
                            start
                        </Button>
                    </Box>
                </Box>
                <Smartdashboard callback_box={callback_box} />
            </GlobalContext.Provider>
        </div>
    );
}

