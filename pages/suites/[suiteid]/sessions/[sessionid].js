import { useState, useEffect } from 'react'

import Head from "next/head";
import Header from "@/c/header";

import { SITE_NAME } from "@/l/constants";
import { useRouter } from "next/router";
import ScoreTable from '@/c/score-table';
import SessionStatistics from '@/c/session-statistics';

export default function Suites() {
    const router = useRouter();
    const [suiteData, setSuiteData] = useState(null)
    const [sessionData, setSessionData] = useState(null)
    const [notFound, setNotFound] = useState(false)


    async function fetchSuite() {
        if (window[`saved-suite-${router.query.suiteid}`]) {
            console.log("Retrieved suite from window!")
            setSessionData(window[`saved-suite-${router.query.suiteid}-sessions`])
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
        let sessions;
        if (window[`saved-suite-${router.query.suiteid}-sessions`]) {
            console.log("Retrieved session from window!")
            sessions = window[`saved-suite-${router.query.suiteid}-sessions`];
        } else {
            const res = await fetch(`/api/leaderboard/suites/${router.query.suiteid}/sessions`);
            if (res.status == 404) {
                setNotFound(true);
                return;
            }
            if (res.status != 200) {
                return;
            }
            sessions = (await res.json()).sessions
            window[`saved-suite-${router.query.suiteid}-sessions`] = sessions; // Save to avoid having to fetch it again
        }

        let session = sessions.filter(i => i.id == router.query.sessionid);
        if (!session.length) {
            setNotFound(true);
            return;
        }
        session = session[0];
        if (session.suiteId != router.query.suiteid) {
            setNotFound(true);
            return;
        }
        console.log(session)

        //Calculate rank, min, max etc.
        // sessions.sort((a,b) => a.totalScore - b.totalScore);

        setSessionData({...session, rank: sessions.indexOf(session), totalSessions: sessions.length, minTotalScore: Math.min(...sessions.map(i => i.totalScore)), maxTotalScore: Math.max(...sessions.map(i => i.totalScore))})
    }

    useEffect(() => {
        if (!router.isReady) return;
        fetchSuite();
        fetchSessions();
    }, [router.isReady])

    if (notFound) {
        return <h1>Suite {router.query.suiteid} not found</h1>
    }

    return (<>
        <Head>
            <title>{`Session | ${SITE_NAME}`}</title>
            <link rel="icon" href="/favicon.ico" />
        </Head>
        <Header />
        <div className='container'>
            <h2>Session - {sessionData ? sessionData.name : router.query.sessionid}</h2>
            <SessionStatistics sessionData={sessionData} suiteData={suiteData}/>
            <ScoreTable data={sessionData?.scores}/>
        </div>
    </>);
}
