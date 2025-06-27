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
    const [notFound, setNotFound] = useState(false)

    async function fetchSuite() {
        if(window[`saved-suite-${router.query.suiteid}`]){
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
        if(window[`saved-suite-${router.query.suiteid}-sessions`]){
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

    useEffect(() => {
        if (!router.isReady) return;
        fetchSuite();
        fetchSessions();
    }, [router.isReady])

    if (notFound) {
        return <h1>Suite {router.query.suiteid} not found</h1>
    }

    // const chartOptions = useMemo(() => {
    //     if (!sessionData) {
    //         return {}
    //     }
    //     return {
    //         xAxis: {
    //             type: 'time',
    //             boundaryGap: false
    //         },
    //         yAxis: {
    //             type: 'value',
    //             name: 'Score', nameLocation: 'center',
    //             nameTextStyle: {
    //                 color: '#eee',
    //                 fontWeight: 'bold',
    //             },
    //         },
    //         series: [
    //             {
    //                 data: sessionData.map((i, k) => [i.date, i.totalScore]),
    //                 type: 'line',
    //                 // name: 'Export',
    //                 smooth: false,
    //             },
    //         ],
    //         tooltip: {
    //             trigger: 'axis',
    //             // formatter: function (params) {
    //             //     const xAxisLabel = params[0].axisValue;
    //             //     let tooltipText = `<strong>${fromNow(xAxisLabel)} - ${hourMinutes(xAxisLabel)}</strong><br/>`;
    //             //     params.forEach((item) => {
    //             //         tooltipText += `
    //             //         <span style="display:inline-block;margin-right:5px;
    //             //             border-radius:10px;width:9px;height:9px;
    //             //             background-color:${item.color}"></span>
    //             //         ${item.seriesName}: <strong>${item.data[1]}</strong><br/>
    //             //         `;
    //             //     });
    //             //     return tooltipText;
    //             // },
    //         },
    //         // legend: {
    //         //     data: ['Import', 'Export'],
    //         //     orient: 'vertical',
    //         //     right: 10,
    //         //     top: 'center',
    //         //     textStyle: {
    //         //         color: '#eee'
    //         //     },
    //         // },
    //         dataZoom: [
    //             {
    //                 type: 'inside',
    //                 start: 0,
    //                 end: 100
    //             },
    //             {
    //                 start: 0,
    //                 end: 100
    //             }
    //         ],
    //     }
    // }, [sessionData]);

    return (<>
        <Head>
            <title>{SITE_NAME}</title>
            <link rel="icon" href="/favicon.ico" />
        </Head>
        <Header />
        <div className='container'>
            <Breadcrumb>{[{href: '/', name: 'Home'}, {href: '/suites', name: 'Suites'}, {name: suiteData ? suiteData.name : router.query.suiteid}]}</Breadcrumb>
            <h2>Suite - {suiteData ? suiteData.name : router.query.suiteid}</h2>
            <SuiteStatistics suiteData={suiteData} sessionData={sessionData}/>
            <section>
                <h3>Session scores</h3>
                <LineChart values={sessionData?.map(i => ({name: i.name, value: i.totalScore})) || []}/>
                {/* <Chart options={chartOptions}/> */}
            </section>
            <SessionsTable data={sessionData} />
        </div>
    </>);
}
