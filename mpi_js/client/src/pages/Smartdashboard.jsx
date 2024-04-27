import React from 'react'
import Pies from '../components/Pies';
import Graphs from '../components/Graphs';

import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

// const all_data_graph_example = {
//     "0": [8676.52938793453],
//     "1": [8673.061550656084],
//     "2": [8676.529388451485],
//     "3": [8391.079251493487],
//     "4": [8368.652538685239],
//     "5": [8368.652538685239],
//     "6": [8508.59656157823],
//     "7": [8368.652539183851],
//     "type": "graph"
// };

let all_data = {};
const preprocess_data = (new_data) => {
    let result = { ...all_data };
    for (const [key, value] of Object.entries(new_data.data)) {
        if (!result[key]) result[key] = {};
        if (value.type === "pie") {
            result[key] = { ...result[key], type: value.type, [new_data.pid]: value.data };
        } else if (value.type === "graph") {
            // console.log("new_data", new_data)
            if (!result[key][new_data.pid]) result[key][new_data.pid] = [];
            result[key][new_data.pid] = result[key][new_data.pid].concat(value.data);
            if (result[key][new_data.pid].length > 50) {
                result[key][new_data.pid] = result[key][new_data.pid].slice(1);
                result[key].offset = result[key].offset ? result[key].offset + 1 : 1;
            }
        }
    }
    all_data = result;
    // console.log("new_data", new_data, "all_data", all_data);
    return result;
}

export default function Smartdashboard({ callback_box }) {
    const [graphData, setGraphData] = React.useState({});
    callback_box.callback = (d) => {
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
    };

    const wrap_in_accordion = (title, contents) => {
        return (
            <Accordion slotProps={{ transition: { unmountOnExit: true } }} key={title}>
                <AccordionSummary
                    expandIcon={<ArrowDropDownIcon />}
                >
                    <Typography>{title}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    {contents}
                </AccordionDetails>
            </Accordion>
        );
    }

    return (
        <div>
            {
                Object.keys(graphData).map((key, idx) => {
                    if (graphData[key].type === "pie") {
                        return wrap_in_accordion(key, <Pies dict={graphData[key]} name={key} key={idx} />);
                    } else {
                        return wrap_in_accordion(key, <Graphs dict={graphData[key]} name={key} key={idx} />);
                        // return <Graphs dict={graphData[key]} name={key} key={idx} />
                    }
                })
            }
        </div>
    )
}
