import logo from './logo.svg';
import './App.css';

function App() {

    console.log("Loading App.js");
    const worker = new Worker("./mpi_core/workspace/sqrt/main.js");

    worker.onmessage = async (m) => {
        console.log("Main UI received msg", m.data.foo);
        if (m.data.command === "barrier") {
            console.log("Main UI received barrier");
            await new Promise((resolve) => setTimeout(resolve, 1000));
            console.log("Main UI continuing barrier")
            worker.postMessage({ command: "barrier", status: "end" });
        }
    };

    console.log("Main UI Sending start message to worker")
    worker.postMessage({ command: "start", foo: "bar" });


    return (
        <div className="App">
            <header className="App-header">
                <img src={logo} className="App-logo" alt="logo" />
                <p>
                    Edit <code>src/App.js</code> and save to reload.
                </p>
                <a
                    className="App-link"
                    href="https://reactjs.org"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Learn React
                </a>
            </header>
        </div>
    );
}

export default App;
