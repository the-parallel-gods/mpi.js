import React, { useEffect } from 'react';
import './App.css';
import { Job } from './mpi_core/job';
import Smartdashboard from './pages/Smartdashboard';
import TopBar from './components/TopBar';

const callback_box = { callback: () => { } };
const GlobalContext = React.createContext(null);
export default function App() {
    const [context, setContext] = React.useState({ a: "1" });

    useEffect(() => {
        const num_proc = 4;
        const path = "./mpi_core/workspace/tests/test_bcast.js";
        new Job(callback_box, path, num_proc, window.location.host);
    }, []);
    return (
        <div>
            <GlobalContext.Provider value={{ context, setContext }}>
                <TopBar />
                <Smartdashboard callback_box={callback_box} />
            </GlobalContext.Provider>
        </div>
    );
}

