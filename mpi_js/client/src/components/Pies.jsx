import React from 'react'
import { Box } from '@mui/system';
import { PieChart } from '@mui/x-charts/PieChart';
import { useDrawingArea } from '@mui/x-charts/hooks';
import { styled } from '@mui/material/styles';



function DrawPie({ dict, name, proc }) {
    // const dict_example = {
    //     "MPI_Barrier": 9.00000000372529,
    //     "MPI_Bcast": 0.19999999925494194,
    //     "MPI_Send": 125.39999999850988,
    //     "Other": 509.8999999985099
    // };

    // change a to the data format that Pie needs
    let data = [];
    let id_counter = 0;
    for (const key in dict) data.push({ name, id: id_counter++, label: key, value: dict[key] });


    const StyledText = styled('text')(({ theme }) => ({
        fill: theme.palette.text.primary,
        textAnchor: 'middle',
        dominantBaseline: 'central',
        fontSize: 20,
    }));

    function PieCenterLabel({ children }) {
        const { width, height, left, top } = useDrawingArea();
        return (
            <StyledText x={left + width / 2} y={top + height / 2}>
                {children}
            </StyledText>
        );
    }

    return (
        <PieChart
            series={[
                {
                    data,
                    highlightScope: { faded: 'global', highlighted: 'item' },
                    faded: { innerRadius: 60, additionalRadius: 0, color: 'gray' },
                    highlighted: { innerRadius: 55, additionalRadius: 2 },
                    innerRadius: 60,
                    outerRadius: 98,
                    cornerRadius: 5,

                },
            ]}
            width={400}
            height={200}
        >
            <PieCenterLabel>Node {proc}</PieCenterLabel>
        </PieChart>
    );
}


export default function Pies({ dict, name }) {
    // const example_dict = {
    //     "0": [{
    //         "MPI_Barrier": 60.400000002235174,
    //         "MPI_Bcast": 0.19999999925494194,
    //         "MPI_Recv": 0.900000000372529,
    //         "Other": 445.6999999973923
    //     }],
    //     "1": [{
    //         "MPI_Barrier": 8.700000002980232,
    //         "MPI_Bcast": 0.2999999988824129,
    //         "MPI_Send": 17.800000000745058,
    //         "Other": 428.89999999664724
    //     }],
    //     "2": [{
    //         "MPI_Barrier": 9,
    //         "MPI_Bcast": 0.19999999925494194,
    //         "MPI_Send": 24,
    //         "Other": 423.5
    //     }],
    //     "type": "pie",
    // }
    return (
        <div>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', flexDirection: 'row' }}>
                {
                    Object.keys(dict).filter(key => key !== "type").map((key, idx) => {
                        return <DrawPie dict={dict[key][0]} name={name} proc={key} key={idx} />
                    })
                }
            </Box>
        </div >
    )
}
