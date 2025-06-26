import { useState, useEffect } from 'react'

import Head from "next/head";
import Header from "@/c/header";

import SessionsTable from "@/c/sessions-table";
import { SITE_NAME } from "@/l/constants";
import { useRouter } from "next/router";

export default function Suites() {
    const router = useRouter();
    const [suiteData, setSuiteData] = useState(null)
    const [sessionData, setSessionData] = useState(null)
    const [notFound, setNotFound] = useState(false)

    async function fetchSuite() {
        if(window[`saved-suite-${router.query.suiteid}`]){
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

    return (<>
        <Head>
            <title>{SITE_NAME}</title>
            <link rel="icon" href="/favicon.ico" />
        </Head>
        <Header />
        <div className='container'>
            <h2>Suite - {suiteData ? suiteData.name : router.query.suiteid}</h2>
            <SessionsTable data={sessionData} />
        </div>
    </>);
}
