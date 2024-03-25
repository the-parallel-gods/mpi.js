self.onmessage = function (e) {
    var sharedWorkerPort = e.data.sharedWorkerPort;
    sharedWorkerPort.onmessage = function (e) {
        console.log('received in dedicated worker', e.data);
    };
};