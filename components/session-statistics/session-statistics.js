import styles from './session-statistics.module.scss';
import { useEffect, useState, useRef } from 'react'

export default function SessionStatistics({sessionData, suiteData, ...props}){
    return (
        <p className={styles.text}>Suite: <span>{suiteData?.name}</span>, 
            Total score: <span>{sessionData?.totalScore}</span> (min <span>{sessionData?.minTotalScore}</span>, max <span>{sessionData?.maxTotalScore}</span>), 
            Rank: <span>{sessionData?.rank}/{sessionData?.totalSessions}</span></p>
    )
}
