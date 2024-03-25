self.onconnect = function (e) {
    var port = e.ports[0];

    self.setInterval(function () {
        port.postMessage('sent from shared worker');
    }, 1000);
};