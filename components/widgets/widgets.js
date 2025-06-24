import styles from './widgets.module.scss';
import { useEffect, useState, useRef } from 'react'

export default function Widgets({...props}){
    const [suites, setSuites] = useState('')
    const [sessions, setSessions] = useState('')
    const [testCases, setTestCases] = useState('')


    async function getSuites(){
        const res = await fetch('/api/leaderboard/suites/count');
        if(res.status != 200) return;
        setSuites((await res.json()).count)
    }

    async function getSessions(){
        const res = await fetch('/api/leaderboard/sessions/count');
        if(res.status != 200) return;
        setSessions((await res.json()).count)
    }
    
    async function getTestCases(){
        const res = await fetch('/api/leaderboard/test-cases/count');
        if(res.status != 200) return;
        setTestCases((await res.json()).count)
    }

    useEffect(() => {
        getSuites();
        getSessions();
        getTestCases();
    }, [])
    
    return (
        <section className={styles.widgetContainer}>
            <Widget>
                <h3>
                    <span className={styles.info}>{suites}</span> suites, <span className={styles.info}>{sessions}</span> sessions, <span className={styles.info}>{testCases}</span> test cases. 
                </h3>
            </Widget>
            <Widget/>
            <Widget/>
            <Widget/>
        </section>
    )
}

function Widget({children}){
    return <div className={styles.widget}>{children}</div>
}
