import Header from "@/c/header";
import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";

import { FaDownload } from "react-icons/fa6";

import SwaggerUI from "swagger-ui-react";
import Head from "next/head";
import { SITE_NAME } from "@/l/constants.js";

export default function SwaggerPage({ spec }) {
    return (
        <div
            style={{
                background: "white",
                paddingTop: "1rem",
                color: "black",
                flex: 1,
            }}
        >
            <Head>
                <title>{`Docs | ${SITE_NAME}`}</title>
            </Head>
            <Header light />
            <div style={{ padding: "0 1rem" }}>
                <a href="/api/docs" download>
                    <FaDownload />
                    &nbsp;Download JSON
                </a>
            </div>
            <SwaggerUI url={'/api/docs'} />
        </div>
    );
}