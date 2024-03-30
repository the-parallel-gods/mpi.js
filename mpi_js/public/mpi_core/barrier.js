const MPI_Barrier = () => {
    return new Promise((resolve, reject) => {
        blocking_resume_callback = resolve;
        console.log('MPI_Barrier called');
        sendMsg({ command: 'barrier', status: "start" });
    });
}