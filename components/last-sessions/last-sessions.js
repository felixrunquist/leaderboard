import { fromNow } from '@/l/helper';
import styles from './last-sessions.module.scss';
import { useEffect, useState, useRef } from 'react'

export default function LastSessions() {
    const [sessions, setSessions] = useState([]);

    async function fetchSessions(){
        const res = await fetch('/api/leaderboard/sessions/latest');
        if(res.status != 200){
            return;
        }
        setSessions((await res.json()).sessions.filter((_,k) => k < 4));

    }

    useEffect(() => {
        fetchSessions();
    },[])

    console.log(sessions)

    return (
        <section>
            <h2>Latest sessions</h2>
            <div className={styles.sessions}>
                {sessions.map((i,k) => <a key={k}>
                    <h3>{i.suite.name} →</h3>
                    <p style={{textTransform: ''}}>{fromNow(i.date)} - Score: {Math.round(i.score * 100) / 100}</p>
                </a>)}

            </div>
        </section>
    )
}
