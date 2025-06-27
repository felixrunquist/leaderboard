import styles from './sessions-table.module.scss';
import { useMemo, useRef, useEffect } from 'react'

import Grid from '@/c/grid';
import { fromNow } from '@/l/helper';
import Link from 'next/link';

export default function SessionsTable({ data, pagingPanelElement, ...props }) {
    const gridRef = useRef();

    const columns = useMemo(() => [
        {
            headerName: 'Rank',
            valueFormatter: i => data?.indexOf(i.data) + 1,
            sort: 'desc'
        },
        {
            field: 'name',
            cellRenderer: i => <Link href={`/suites/${i.data.suiteId}/sessions/${i.data.id}`}>{i.value}</Link>,
            flex: 2
        },
        {
            field: 'date',
            valueFormatter: i => fromNow(i.value)
        },
        {
            headerName: 'User',
            field: 'username'
        },
        {
            headerName: 'Score',
            field: 'totalScore',
            valueFormatter: i => Math.round(i.value * 100) / 100,
        }
    ], [data])

    useEffect(() => {
        if (gridRef.current.api) {
            gridRef.current.api.paginationGoToNextPage();
        }
    }, [data]);

    return (
        <section style={{ flex: 1, display: "flex", minHeight: "50rem", padding: 0, clipPath: 'inset(0px round .5rem)', }}>
            <Grid
                ref={gridRef}
                sticky
                rowData={data}
                columnDefs={columns}
                pagination
                paginationPageSize={100}
                paginationPageSizeSelector={[10, 25, 50, 100]}
                dark
                pagingPanelElement={pagingPanelElement}
                loading={data === null}
            />
        </section>
    )
}