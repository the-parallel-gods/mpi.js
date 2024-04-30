import React, { useEffect } from 'react';
import './App.css';
import { Job } from './mpi_core/job';
import Smartdashboard from './pages/Smartdashboard';
import TopBar from './components/TopBar';
import { GlobalRouter } from './mpi_core/global_router';
import TextField from '@mui/material/TextField';
import { Box, FormControlLabel, InputLabel, MenuItem, Switch } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SyncOutlinedIcon from '@mui/icons-material/SyncOutlined';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import LoadingButton from '@mui/lab/LoadingButton';

const GlobalContext = React.createContext(null);
const callback_box = { callback: () => { } };
let global_router, start_job_fn, set_finish_status, set_gr_id, on_start_button;

export default function App() {
    const [context, setContext] = React.useState({
        gr_id: -1,
        program_path: "tests/test_mult.js",
        num_proc: 4,
        interconnect: "crossbar",
        enable_smartdashboard: true,
        enable_diagnostics: true,
        optimized: true,
        status: 0,
    });

    set_finish_status = () => {
        if (context.status !== 3) setContext({ ...context, status: 3 });
    }

    set_gr_id = (gr_id) => {
        console.log("set_gr_id", gr_id);
        setContext({ ...context, gr_id })
    };
    start_job_fn = () => {
        setContext({ ...context, status: 2 });
        new Job(
            callback_box,
            context.num_proc,
            global_router,
            context.interconnect,
            context.enable_smartdashboard,
            context.enable_diagnostics,
            () => set_finish_status()
        );
    };
    on_start_button = () => {
        if (context.status === 0) {
            global_router.start(context.num_proc, context.program_path, context.optimized);
            console.log("Start requested");
            setContext({ ...context, status: 1 });
        } else if (context.status === 3) {
            window.location.reload();
        }
    }

    useEffect(() => {
        const ws_url = window.location.host.split(":")[0];
        global_router = new GlobalRouter();
        global_router.init(ws_url, set_gr_id).then(() => { start_job_fn(); });
    }, []);


    const get_status = () => {
        // returns the button text, loading, and icon
        if (context.status === 0) return ["start", false, <PlayArrowIcon key={0} />];
        if (context.status === 1) return ["waiting", true, <PlayArrowIcon key={1} />];
        if (context.status === 2) return ["running", true, <SyncOutlinedIcon key={2} />];
        if (context.status === 3) return ["restart", false, <SyncOutlinedIcon key={3} />];
    }

    console.log("RENDER: gr_id", context.gr_id);
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
                    <TextField sx={{ m: 3 }} id="num_proc" type="number" label="Num proc" variant="outlined" fullWidth
                        value={context.num_proc} onChange={(e) => setContext({ ...context, num_proc: parseInt(e.target.value) })}
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
                    <FormControlLabel sx={{ m: 3 }} control={<Switch checked={context.enable_smartdashboard} />} label="Enable Smartdashboard"
                        value={context.enable_smartdashboard} onChange={(e) => setContext({ ...context, enable_smartdashboard: e.target.checked })} />
                    <FormControlLabel sx={{ m: 3 }} control={<Switch checked={context.enable_diagnostics} />} label="Enable Diagnostics"
                        value={context.enable_diagnostics} onChange={(e) => setContext({ ...context, enable_diagnostics: e.target.checked })}
                    />
                    {(context.gr_id === 0) ?
                        <FormControlLabel sx={{ m: 3 }} control={<Switch checked={context.optimized} />} label="Auto optimize"
                            value={context.optimized} onChange={(e) => setContext({ ...context, optimized: e.target.checked })}
                        /> : ""}
                    <Box sx={{ m: 3 }}>
                        <LoadingButton
                            endIcon={get_status()[2]}
                            loading={get_status()[1]}
                            loadingPosition="end"
                            variant="outlined"
                            size="large"
                            onClick={on_start_button}
                        >
                            <span>{get_status()[0]}</span>
                        </LoadingButton>
                    </Box>
                </Box>
                <Smartdashboard callback_box={callback_box} />
            </GlobalContext.Provider>
        </div>
    );
}

