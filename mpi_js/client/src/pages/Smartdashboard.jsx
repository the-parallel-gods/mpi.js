import React from 'react'
import Pies from '../components/Pies';

let all_data = {};
const preprocess_data = (new_data) => {
    let result = { ...all_data };
    for (const [key, value] of Object.entries(new_data.data)) {
        if (!result[key]) result[key] = {};
        result[key] = { ...result[key], type: value.type, [new_data.pid]: value.data };
    }
    all_data = result;
    // console.log("new_data", new_data, "all_data", all_data);
    return result;
}

export default function Smartdashboard({ setCallback }) {
    const [graphData, setGraphData] = React.useState({});
    setCallback((d) => {
        // const example_data = {
        //     "pid": 6,
        //     "data": {
        //         "Total Time": {
        //             "name": "Total Time",
        //             "type": "pie",
        //             "data": [{
        //                 "MPI_Barrier": 1.3000000044703484,
        //                 "MPI_Bcast": 0.29999999701976776,
        //                 "MPI_Send": 0.7000000029802322,
        //                 "Other": 698.3999999985099
        //             }]
        //         }
        //     }
        // };
        setGraphData(preprocess_data(d));
    });


    return (
        <div>
            {
                Object.keys(graphData).map((key, idx) => {
                    if (graphData[key].type === "pie") {
                        return <Pies dict={graphData[key]} name={key} key={idx} />
                    }
                })
            }
        </div>
    )
}
