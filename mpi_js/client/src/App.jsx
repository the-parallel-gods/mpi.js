import React, { useEffect } from 'react';
import './App.css';
import { Job } from './mpi_core/job';

const GlobalContext = React.createContext(null);
export default function App() {
    const [context, setContext] = React.useState({ a: "1" });

    useEffect(() => {
        new Job();
    }, []);
    return (
        <div>
            <GlobalContext.Provider value={{ context, setContext }}>
            </GlobalContext.Provider>
        </div>
    );
}

