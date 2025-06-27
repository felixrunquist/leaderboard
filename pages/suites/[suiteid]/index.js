import { useState, useEffect, useMemo, useRef } from 'react'

import Head from "next/head";
import Header from "@/c/header";

import SessionsTable from "@/c/sessions-table";
import { SITE_NAME } from "@/l/constants";
import { useRouter } from "next/router";
import SuiteStatistics from '@/c/suite-statistics';
import LineChart from '@/c/line-chart';
import Chart from '@/c/chart';
import Breadcrumb from '@/c/breadcrumb';

export default function Suite() {
    const router = useRouter();
    const [suiteData, setSuiteData] = useState(null)
    const [sessionData, setSessionData] = useState(null)
    const [dateSessionData, setDateSessionData] = useState(null)
    const [notFound, setNotFound] = useState(false)

    const [continueToken, setContinueToken] = useState(null)
    const continueRef = useRef();
    continueRef.current = continueToken;

    async function fetchSuite() {
        if (window[`saved-suite-${router.query.suiteid}`]) {
            console.log("Retrieved suite from window!")
            setSuiteData(window[`saved-suite-${router.query.suiteid}`])
            return;
        }
        const res = await fetch(`/api/leaderboard/suites/${router.query.suiteid}`);
        if (res.status == 404) {
            setNotFound(true);
            return;
        }
        if (res.status != 200) {
            return;
        }
        const suite = (await res.json()).suite
        setSuiteData(suite);
        window[`saved-suite-${router.query.suiteid}`] = suite; // Save to avoid having to fetch it again
    }

    async function fetchSessions() {
        // if (!continueRef.current && window[`saved-suite-${router.query.suiteid}-sessions`]) {
        //     console.log("Retrieved session from window!")
        //     setSessionData(window[`saved-suite-${router.query.suiteid}-sessions`])
        //     return;
        // }
        const res = await fetch(`/api/leaderboard/suites/${router.query.suiteid}/sessions` + (continueRef.current ? `?continueToken=${continueRef.current}` : ''));
        if (res.status == 404) {
            setNotFound(true);
            return;
        }
        if (res.status != 200) {
            return;
        }
        const json = await res.json()
        console.log(json)
        const sessions = json.sessions
        setSessionData(i => {
            const ret = i ? [...i, ...sessions] : sessions
            // window[`saved-suite-${router.query.suiteid}-sessions`] = sessions; // Save to avoid having to fetch it again
            return ret;
        })
        setContinueToken(json.continueToken)
    }
    
    async function fetchDateSessions() {
        const res = await fetch(`/api/leaderboard/suites/${router.query.suiteid}/sessions?order=date`);
        if (res.status == 404) {
            setNotFound(true);
            return;
        }
        if (res.status != 200) {
            return;
        }
        const sessions = (await res.json()).sessions
        setDateSessionData(sessions)
    }

    useEffect(() => {
        if (!router.isReady) return;
        fetchSuite();
        fetchSessions();
        fetchDateSessions();
    }, [router.isReady])

    if (notFound) {
        return <h1>Suite {router.query.suiteid} not found</h1>
    }

    const chartOptions = useMemo(() => {
        if (!dateSessionData) {
            return {}
        }
        return {
            xAxis: {
                type: 'time',
            },
            yAxis: {
                type: 'value',
                name: 'Score', nameLocation: 'center',
                nameTextStyle: {
                    color: '#eee',
                    fontWeight: 'bold',
                },
            },
            series: [
                {
                    data: dateSessionData.map((i, k) => [i.date, i.totalScore]),
                    type: 'line',
                    smooth: false,
                },
            ],
            tooltip: {
                trigger: 'axis',
            },
            dataZoom: [
                {
                    type: 'inside',
                    start: 0,
                    end: 100
                },
                {
                    start: 0,
                    end: 100
                }
            ],
        }
    }, [dateSessionData]);

    return (<>
        <Head>
            <title>{SITE_NAME}</title>
            <link rel="icon" href="/favicon.ico" />
        </Head>
        <Header />
        <div className='container'>
            <Breadcrumb>{[{ href: '/', name: 'Home' }, { href: '/suites', name: 'Suites' }, { name: suiteData ? suiteData.name : router.query.suiteid }]}</Breadcrumb>
            <h2>Suite - {suiteData ? suiteData.name : router.query.suiteid}</h2>
            <SuiteStatistics suiteData={suiteData} sessionData={sessionData} />
            <section>
                <h3>Session scores</h3>
                <LineChart values={sessionData?.map(i => ({ name: i.name, value: i.totalScore })) || []} />
                <div style={{ width: '100%', height: '20rem' }}>
                    <Chart options={chartOptions} />
                </div>
            </section>
            {continueToken && <div style={{marginBottom: '1rem'}}><FetchMoreData fetch={fetchSessions}/></div>}
            <SessionsTable data={sessionData} pagingPanelElement={continueToken && <FetchMoreData fetch={fetchSessions} />}/>
        </div>
    </>);
}

function FetchMoreData({fetch}) {
    return (
            <button onClick={fetch || null}>Fetch more data</button>
    );
}