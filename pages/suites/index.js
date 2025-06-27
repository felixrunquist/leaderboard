import Head from "next/head";
import Header from "@/c/header";

import LastSessions from "@/c/last-sessions";
import Widgets from "@/c/widgets";
import SuitesTable from "@/c/suites-table";
import { SITE_NAME } from "@/l/constants";
import Breadcrumb from "@/c/breadcrumb";

export default function Suites() {
    return (<>
        <Head>
            <title>{SITE_NAME}</title>
            <link rel="icon" href="/favicon.ico" />
        </Head>
        <Header />
        <div className='container'>
            <Breadcrumb>{[{href: '/', name: 'Home'}, {name: 'Suites'}]}</Breadcrumb>
            <h2>Suites</h2>
            <SuitesTable/>
        </div>
    </>);
}
