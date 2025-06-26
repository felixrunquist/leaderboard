import styles from './score-table.module.scss';
import { useMemo } from 'react'

import Grid from '@/c/grid';

export default function ScoreTable({data, ...props}){
    const columns = useMemo(() => [
        {
            headerName: 'Test cases',
            children: [
                {
                    headerName: 'Name',
                    field: 'testCaseName'
                },
                {
                    headerName: 'Weight',
                    field: 'testCaseWeight'
                }
            ]
        }, 
        {
            headerName: 'Session',
            children: [
                {field: 'score'}
            ]
        }
    ], [])

    return (
        <section style={{ flex: 1, display: "flex", minHeight: "50rem", padding: 0, clipPath: 'inset(0px round .5rem)', }}>
            <Grid
                sticky
                rowData={data}
                columnDefs={columns}
                pagination
                paginationPageSize={100}
                paginationPageSizeSelector={[10, 25, 50, 100]}
                dark
                loading={data == null}
            />
        </section>
    )
}
