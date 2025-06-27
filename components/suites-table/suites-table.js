import { fromNow } from '@/l/helper';
import styles from './suites-table.module.scss';
import { useEffect, useState, useRef, useMemo } from 'react'
import Grid from '@/c/grid';
import Link from 'next/link';

export default function SuitesTable({...props}){
    const [suites, setSuites] = useState(null);
    const [continueToken, setContinueToken] = useState(null)
    const continueRef = useRef();
    const gridRef = useRef();

    continueRef.current = continueToken;

    async function fetchSuites(){
        if(suites && !continueRef.current){
            return;
        }
        const res = await fetch('/api/leaderboard/suites' + (continueRef.current ? `?continueToken=${continueRef.current}` : ''));
        if(res.status != 200){
            return;
        }
        const json = await res.json();
        console.log(json, continueRef.current, json.continueToken)
        setSuites(i => i ? [...i, ...json.suites] : json.suites);
        setContinueToken(json.continueToken);
        continueRef.current = json.continueToken;
    }

    useEffect(() => {
        if(!suites) fetchSuites();
    }, [])

    useEffect(() => {
        if (gridRef.current.api) {
            gridRef.current.api.paginationGoToNextPage();
        }
    }, [suites]);

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

    // async function fetchMore(){
    //     const res = await fetch('/api/leaderboard/suites');
    //     if(res.status != 200){
    //         return;
    //     }
    //     const json = await res.json();
    //     setSuites(json.suites);
    // }

    return (
        <section style={{flex: 1, display: "flex", minHeight: "50rem", padding: 0, clipPath: 'inset(0px round .5rem)', }}>
            <Grid
                ref={gridRef}
                sticky
                rowData={suites}
                columnDefs={columns}
                pagination
                paginationPageSize={100}
                paginationPageSizeSelector={[10, 25, 50, 100]}
                dark
                pagingPanelElement={continueToken && <FetchMoreData fetch={fetchSuites} />}
                loading={suites === null}
            />
        </section>
    )
}

function FetchMoreData({fetch}) {
    return (
            <button onClick={fetch || null}>Fetch more data</button>
    );
}