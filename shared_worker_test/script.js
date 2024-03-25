var sharedWorker = new SharedWorker("worker-shared.js");
sharedWorker.port.start();

var dedicatedWorker = new Worker("worker-dedicated.js");
dedicatedWorker.postMessage({ sharedWorkerPort: sharedWorker.port }, [sharedWorker.port]);
