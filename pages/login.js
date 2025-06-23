import {useState, useEffect} from "react";

import Head from "next/head";

import Login from "@/c/login";
import { SITE_NAME } from "@/l/constants.js";

export default function LoginPage() {

    return (
        <div className="root">
            <Head>
                <title>{`Login | ${SITE_NAME}`}</title>
            </Head>
            <Login/>
        </div>
    );
}