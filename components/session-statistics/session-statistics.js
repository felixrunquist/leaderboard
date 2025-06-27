import Link from 'next/link';
import styles from './session-statistics.module.scss';
import { useEffect, useState, useRef } from 'react'

export default function SessionStatistics({sessionData, suiteData, ...props}){
    return (
        <p className={styles.text}>Suite: <span><Link href={`/suites/${suiteData?.id}`}>{suiteData?.name}</Link></span>, 
            Total score: <span>{sessionData?.session.totalScore}</span> (min <span>{sessionData?.minScore}</span>, max <span>{sessionData?.maxScore}</span>), 
            Rank: <span>{sessionData?.rank}/{sessionData?.totalSessions}</span></p>
    )
}
