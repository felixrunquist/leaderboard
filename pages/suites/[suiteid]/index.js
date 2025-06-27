import { useState, useEffect, useMemo } from 'react'

import Head from "next/head";
import Header from "@/c/header";

import SessionsTable from "@/c/sessions-table";
import { SITE_NAME } from "@/l/constants";
import { useRouter } from "next/router";
import SuiteStatistics from '@/c/suite-statistics';
import LineChart from '@/c/line-chart';
import Chart from '@/c/chart';
import Breadcrumb from '@/c/breadcrumb';

export default function Suites() {
    const router = useRouter();
    const [suiteData, setSuiteData] = useState(null)
    const [sessionData, setSessionData] = useState(null)
    const [dateSessionData, setDateSessionData] = useState(null)
    const [notFound, setNotFound] = useState(false)

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
        if (window[`saved-suite-${router.query.suiteid}-sessions`]) {
            console.log("Retrieved session from window!")
            setSessionData(window[`saved-suite-${router.query.suiteid}-sessions`])
            return;
        }
        const res = await fetch(`/api/leaderboard/suites/${router.query.suiteid}/sessions`);
        if (res.status == 404) {
            setNotFound(true);
            return;
        }
        if (res.status != 200) {
            return;
        }
        const sessions = (await res.json()).sessions
        setSessionData(sessions)
        window[`saved-suite-${router.query.suiteid}-sessions`] = sessions; // Save to avoid having to fetch it again
    }
    
    async function fetchDateSessions() {
        // if (window[`saved-suite-${router.query.suiteid}-sessions`]) {
        //     console.log("Retrieved session from window!")
        //     setSessionData(window[`saved-suite-${router.query.suiteid}-sessions`])
        //     return;
        // }
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
        // window[`saved-suite-${router.query.suiteid}-sessions`] = sessions; // Save to avoid having to fetch it again
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
        if (!sessionData) {
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
    }, [sessionData]);

    console.log(chartOptions)

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
            <SessionsTable data={sessionData} />
        </div>
    </>);
}
