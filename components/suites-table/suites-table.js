import { fromNow } from '@/l/helper';
import styles from './suites-table.module.scss';
import { useEffect, useState, useRef, useMemo } from 'react'
import Grid from '@/c/grid';
import Link from 'next/link';

export default function SuitesTable({...props}){
    const [suites, setSuites] = useState(null);
    const continueToken = useRef();

    async function fetchSessions(){
        const res = await fetch('/api/leaderboard/suites');
        if(res.status != 200){
            return;
        }
        const json = await res.json();
        setSuites(json.suites);
        continueToken.current = json.continueToken;
    }

    useEffect(() => {
        fetchSessions();
    }, [])

    const columns = useMemo(() => [
        {
            field: 'name',
            cellRenderer: i => <Link href={`/suites/${i.data.id}`}>{i.value}</Link>
        },
        {field: 'rankAlgorithm'},
        {
            headerName: 'Created',
            field: 'created',
            valueFormatter: i => fromNow(i.value)
        },
        {
            headerName: 'Updated',
            field: 'updated',
            valueFormatter: i => fromNow(i.value),
            sort: 'desc'
        }
    ], []);

    return (
        <section style={{flex: 1, display: "flex", minHeight: "50rem", padding: 0, clipPath: 'inset(0px round .5rem)', }}>
            <Grid
                sticky
                rowData={suites}
                columnDefs={columns}
                pagination
                paginationPageSize={100}
                paginationPageSizeSelector={[10, 25, 50, 100]}
                dark
                loading={suites === null}
            />
        </section>
    )
}
