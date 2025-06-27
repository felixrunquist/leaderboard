import styles from './suite-statistics.module.scss';
import {useMemo } from 'react'

export default function SuiteStatistics({suiteData, sessionData, ...props}){
    const max = useMemo(() => sessionData ? Math.max(...sessionData?.map(i => i.totalScore)) : 0, [sessionData])
    const min = useMemo(() => sessionData ? Math.min(...sessionData?.map(i => i.totalScore)) : 0, [sessionData])
    return (
        <p className={styles.text}>
            <span>{sessionData?.length}</span> sessions,
            min score <span>{min}</span>, max score <span>{max}</span>
        </p>
    )
}
