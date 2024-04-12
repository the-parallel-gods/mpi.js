import React from 'react'
import MyPie from './MyPie';
import { Box } from '@mui/system';


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
                        return <MyPie dict={dict[key][0]} name={name} proc={key} key={idx} />
                    })
                }
            </Box>
        </div >
    )
}
