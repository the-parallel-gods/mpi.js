import React, { useEffect } from 'react';
import './App.css';
import { Job } from './mpi_core/job';
import Smartdashboard from './pages/Smartdashboard';
import TopBar from './components/TopBar';

const callback_box = { callback: () => { } };
const GlobalContext = React.createContext(null);
export default function App() {
    const [context, setContext] = React.useState({ a: "1" });
    const setCallback = (callback) => { callback_box.callback = callback; };

    useEffect(() => {
        const num_proc = 8;
        const path = "./mpi_core/workspace/tests/test_mult.js";
        new Job(callback_box, path, num_proc);
    }, []);
    return (
        <div>
            <GlobalContext.Provider value={{ context, setContext }}>
                <TopBar />
                <Smartdashboard setCallback={setCallback} />
            </GlobalContext.Provider>
        </div>
    );
}

