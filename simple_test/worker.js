onmessage = function (event) {
    const data = event.data;
    console.log('Starting job:', data);

    const start_num = data.start_num;
    const end_num = data.end_num;
    const result = [];

    const isPrime = num => {
        for (let i = 2, s = Math.sqrt(num); i <= s; i++) {
            if (num % i === 0) return false;
        }
        return num > 1;
    }

    for (let i = start_num; i <= end_num; i++) {
        if (isPrime(i)) {
            result.push(i);
        }
    }
    postMessage(result);
};
