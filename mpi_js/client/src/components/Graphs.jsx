import React from 'react'
import { LineChart } from '@mui/x-charts/LineChart';
import { Box } from '@mui/system';

function DrawGraph({ arr, proc, offset }) {
    const data = [{ data: arr, label: proc.toString(), showMark: false }];
    const xLabels = Array.from({ length: arr.length }, (_, i) => i + offset).map((v) => v.toString());
    return (
        <LineChart skipAnimation
            width={400}
            height={200}
            series={data}
            xAxis={[{ scaleType: 'point', data: xLabels }]}
        />
    );
}

export default function Graphs({ dict }) {
    // const example_dict = {
    //     "0": [104.71204188248268, 0],
    //     "1": [12.264922322457501, 0, 0],
    //     "2": [12.376237624218863, 0, 0],
    //     "3": [10.305736860396522, 0],
    //     "4": [13.157894736842104, 0, 0],
    //     "5": [13.921113689095128, 0, 0],
    //     "6": [12.809564474644853],
    //     "offset": 100,
    //     "type": "graph",
    // };
    return (
        <div>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', flexDirection: 'row' }}>
                {
                    Object.keys(dict).filter(key => key !== "type" && key !== "offset").map((key, idx) => {
                        return <DrawGraph arr={dict[key]} proc={key} key={idx} offset={dict.offset ? dict.offset : 0} />
                    })
                }
            </Box>
        </div >
    )
}