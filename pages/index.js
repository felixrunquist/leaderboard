import Head from "next/head";
import Header from "@/c/header";

import LastSessions from "@/c/last-sessions";
import Widgets from "@/c/widgets";

export default function Home() {
    return (<>
        <Head>
            <title>Leaderboard</title>
            <link rel="icon" href="/favicon.ico" />
        </Head>
        <Header />
        <div className='container'>
            <Widgets/>
            <LastSessions/>
        </div>
    </>);
}
