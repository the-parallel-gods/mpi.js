import React from 'react';
import { PieChart } from '@mui/x-charts/PieChart';
import { useDrawingArea } from '@mui/x-charts/hooks';
import { styled } from '@mui/material/styles';



export default function MyPie({ dict, name, proc }) {
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
                    highlighted: { innerRadius: 58, additionalRadius: 2 },
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
